from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem, LineItemType
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.models.plan import Plan
from app.models.refund import Refund, RefundStatus
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.schemas.refund import RefundRequest, RefundResponse


def _enrich_refund(db: Session, refund: Refund) -> RefundResponse:
    if not refund:
        return None
    c_name = None
    c_email = None
    p_name = None
    
    cust = db.query(Customer).filter(Customer.id == refund.customer_id).first()
    if cust:
        c_name = cust.full_name
        c_email = cust.email

    inv = db.query(Invoice).filter(Invoice.id == refund.invoice_id).first()
    if inv:
        sub = db.query(Subscription).filter(Subscription.id == inv.subscription_id).first()
        if sub:
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
            if plan:
                p_name = plan.name

    status_val = refund.status.value if hasattr(refund.status, 'value') else str(refund.status)

    return RefundResponse(
        id=refund.id,
        invoice_id=refund.invoice_id,
        customer_id=refund.customer_id,
        amount=refund.amount,
        reason=refund.reason,
        status=status_val,
        created_at=refund.created_at,
        customer_name=c_name,
        customer_email=c_email,
        plan_name=p_name
    )


def process_subscription_refund(db: Session, request: RefundRequest) -> RefundResponse:
    invoice = db.query(Invoice).filter(Invoice.id == request.invoice_id).first()
    if not invoice:
        raise ValueError("Invoice not found.")

    subscription = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first()
    if not subscription:
        raise ValueError("Subscription not found.")

    # R6 Gap Implementation: Trial Detection & Handling
    status_str = subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status)
    if status_str.upper() == "TRIAL" or invoice.amount == 0.0:
        refundable_amount = 0.0
    else:
        total_days = (subscription.end_date - subscription.start_date).days
        if total_days > 0 and date.today() < subscription.end_date:
            unused_days = (subscription.end_date - date.today()).days
            refundable_amount = round((invoice.amount * unused_days) / total_days, 2)
        else:
            refundable_amount = invoice.amount

    db_refund = Refund(
        invoice_id=invoice.id,
        customer_id=subscription.customer_id,
        amount=refundable_amount,
        reason=request.reason or "Customer requested refund",
        status=RefundStatus.COMPLETED,
    )
    db.add(db_refund)

    line_item_refund = InvoiceLineItem(
        invoice_id=invoice.id,
        description=f"Refund Credit ({request.reason or 'Unused period refund'})",
        item_type=LineItemType.PRORATION_CREDIT,
        quantity=1,
        unit_price=-refundable_amount,
        amount=-refundable_amount,
    )
    db.add(line_item_refund)

    # R3 Gap Implementation: Update invoice total & refund_amount after refund processing
    invoice.refund_amount = round((invoice.refund_amount or 0.0) + refundable_amount, 2)
    invoice.amount = max(0.0, round(invoice.amount - refundable_amount, 2))
    invoice.status = "REFUNDED"

    audit = AuditLog(
        event="REFUND_ISSUED",
        performed_by="PAYMENT_GATEWAY",
        description=f"Refund of ${refundable_amount} processed for Invoice #{invoice.invoice_number}. Reason: {request.reason}"
    )
    db.add(audit)

    notif = Notification(
        customer_id=subscription.customer_id,
        notification_type="REFUND_SUCCESSFUL",
        message=f"Refund of ${refundable_amount} for Invoice #{invoice.invoice_number} was successfully processed.",
        sent_date=date.today(),
        status="SENT",
        delivery_channel="SYSTEM"
    )
    db.add(notif)

    db.commit()
    db.refresh(db_refund)
    db.refresh(invoice)

    return _enrich_refund(db, db_refund)


def get_all_refunds(db: Session):
    refunds = db.query(Refund).order_by(Refund.id.desc()).all()
    return [_enrich_refund(db, r) for r in refunds]
