from datetime import date, datetime
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.models.plan import Plan
from app.models.invoice import Invoice
from app.schemas.payment import PaymentCreate, PaymentProcessRequest
from app.schemas.webhook import PaymentWebhookPayload
from app.services.payment_gateway_service import PaymentGatewayService
from app.services.invoice_service import mark_invoice_as_paid
from app.services.webhook_service import send_payment_webhook, process_payment_webhook


def _enrich_payment(db: Session, payment: Payment):
    if not payment:
        return None
    sub = db.query(Subscription).filter(Subscription.id == payment.subscription_id).first() if payment.subscription_id else None
    if sub:
        payment.customer_id = sub.customer_id
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if cust:
            payment.customer_name = cust.full_name
            payment.customer_email = cust.email
        if plan:
            payment.plan_name = plan.name
    elif getattr(payment, "customer_id", None):
        cust = db.query(Customer).filter(Customer.id == payment.customer_id).first()
        if cust:
            payment.customer_name = cust.full_name
            payment.customer_email = cust.email

    if payment.invoice_id:
        inv = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        if inv:
            payment.invoice_number = inv.invoice_number
            if getattr(inv, 'amount', None) and float(inv.amount) > 0:
                payment.amount = float(inv.amount)
    elif payment.subscription_id:
        inv = db.query(Invoice).filter(Invoice.subscription_id == payment.subscription_id).order_by(Invoice.id.desc()).first()
        if inv:
            payment.invoice_id = inv.id
            payment.invoice_number = inv.invoice_number
            if getattr(inv, 'amount', None) and float(inv.amount) > 0:
                payment.amount = float(inv.amount)
    return payment


def create_payment(db: Session, payment: PaymentCreate):
    db_payment = Payment(**payment.model_dump())

    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

    # Automatically update linked invoice status to PAID if payment succeeds
    if str(db_payment.payment_status).upper() in ["SUCCESS", "PAID"] and db_payment.subscription_id:
        try:
            mark_invoice_as_paid(db, subscription_id=db_payment.subscription_id)
        except Exception as inv_err:
            print(f"Automatic invoice status update notice: {inv_err}")

    return _enrich_payment(db, db_payment)


def get_all_payments(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(Payment).filter(Payment.is_deleted == False)

    if status_filter:
        query = query.filter(Payment.payment_status == status_filter.upper())

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Payment.transaction_id.ilike(search_pattern),
                Payment.payment_method.ilike(search_pattern),
            )
        )

    payments = query.order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()
    return [_enrich_payment(db, p) for p in payments]


def get_payment_by_id(db: Session, payment_id: int) -> Optional[Payment]:
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.is_deleted == False)
        .first()
    )
    return _enrich_payment(db, payment)


def delete_payment(db: Session, payment_id: int) -> Optional[Payment]:
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.is_deleted == False)
        .first()
    )

    if payment:
        payment.is_deleted = True
        db.commit()

    return payment


def process_payment(db: Session, request: PaymentProcessRequest) -> dict:
    subscription = db.query(Subscription).filter(Subscription.id == request.subscription_id).first()

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail=f"Subscription #{request.subscription_id} not found."
        )

    if subscription.status.value.upper() == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot process payment for CANCELLED subscription #{subscription.id}."
        )

    target_invoice_id = request.invoice_id
    if not target_invoice_id:
        target_inv = db.query(Invoice).filter(
            Invoice.subscription_id == subscription.id,
            Invoice.status.in_(["PENDING", "UNPAID", "OVERDUE", "PAST_DUE"])
        ).order_by(Invoice.id.desc()).first()
        if target_inv:
            target_invoice_id = target_inv.id

    gateway_res = PaymentGatewayService.simulate_payment(
        subscription_id=request.subscription_id,
        amount=request.amount,
        payment_method=request.payment_method,
        force_status=getattr(request, "force_status", None)
    )

    db_payment = Payment(
        subscription_id=subscription.id,
        invoice_id=target_invoice_id,
        transaction_id=gateway_res.transaction_id,
        payment_status=gateway_res.status,
        payment_method=gateway_res.payment_method,
        payment_date=gateway_res.timestamp,
        amount=gateway_res.amount,
        remarks=getattr(gateway_res, "response_message", None)
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

    webhook_event_status = "PAID" if gateway_res.status == "SUCCESS" else "FAILED"
    webhook_event_type = "payment.paid" if gateway_res.status == "SUCCESS" else "payment.failed"
    webhook_payload = PaymentWebhookPayload(
        invoice_id=target_invoice_id,
        customer_id=subscription.customer_id,
        transaction_id=gateway_res.transaction_id,
        event_type=webhook_event_type,
        amount=gateway_res.amount,
        status=webhook_event_status,
        timestamp=gateway_res.timestamp
    )

    process_payment_webhook(db, webhook_payload)
    send_payment_webhook(webhook_payload)

    if gateway_res.status == "SUCCESS":
        mark_invoice_as_paid(db, subscription.id, gateway_res.timestamp.date())

    return {
        "payment": _enrich_payment(db, db_payment),
        "gateway_response": gateway_res,
        "subscription_status": subscription.status.value
    }


def retry_failed_payment(db: Session, payment_id: int) -> dict:
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.is_deleted == False)
        .first()
    )

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    if payment.payment_status == "SUCCESS":
        return {"message": "Payment has already succeeded. No retry required.", "payment": _enrich_payment(db, payment)}

    retry_request = PaymentProcessRequest(
        subscription_id=payment.subscription_id,
        amount=payment.amount,
        payment_method=payment.payment_method or "Credit Card"
    )

    return process_payment(db, retry_request)