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
    sub = db.query(Subscription).filter(Subscription.id == payment.subscription_id).first()
    if sub:
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if cust:
            payment.customer_name = cust.full_name
            payment.customer_email = cust.email
        if plan:
            payment.plan_name = plan.name
    return payment


def create_payment(db: Session, payment: PaymentCreate):
    db_payment = Payment(**payment.model_dump())

    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

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
                Payment.remarks.ilike(search_pattern)
            )
        )

    payments = query.order_by(Payment.id.desc()).offset(skip).limit(limit).all()
    return [_enrich_payment(db, p) for p in payments]


def get_payment_by_id(db: Session, payment_id: int):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.is_deleted == False
        )
        .first()
    )
    return _enrich_payment(db, payment)


def delete_payment(db: Session, payment_id: int):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.is_deleted == False
        )
        .first()
    )

    if payment:
        payment.is_deleted = True
        db.commit()
        db.refresh(payment)

    return payment


def process_payment(
    db: Session,
    request: PaymentProcessRequest,
):
    gateway_result = PaymentGatewayService.process_payment(
        amount=request.amount
    )

    payment = Payment(
        subscription_id=request.subscription_id,
        amount=request.amount,
        payment_method=request.payment_method,
        transaction_id=gateway_result["transaction_id"],
        payment_date=date.today(),
        payment_status=gateway_result["payment_status"],
        gateway_name="Mock Payment Gateway",
        remarks=gateway_result["response_message"],
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    if gateway_result["payment_status"] == "SUCCESS":
        mark_invoice_as_paid(
            db=db,
            subscription_id=request.subscription_id,
            payment_date=date.today()
        )

    # W1 Gap Implementation: Send POST request to Billing Webhook Endpoint
    sub = db.query(Subscription).filter(Subscription.id == request.subscription_id).first()
    inv = db.query(Invoice).filter(Invoice.subscription_id == request.subscription_id).order_by(Invoice.id.desc()).first()

    customer_id = sub.customer_id if sub else 1
    invoice_id = inv.id if inv else 1

    status_str = "PAID" if gateway_result["payment_status"] == "SUCCESS" else "FAILED"
    event_type = "payment.paid" if status_str == "PAID" else "payment.failed"

    webhook_payload = PaymentWebhookPayload(
        invoice_id=invoice_id,
        customer_id=customer_id,
        transaction_id=gateway_result["transaction_id"],
        event_type=event_type,
        amount=request.amount,
        status=status_str,
        timestamp=datetime.utcnow()
    )

    # Send HTTP POST request to Billing Webhook Endpoint (/payments/webhook)
    webhook_delivery = send_payment_webhook(webhook_payload)
    if not webhook_delivery.get("success"):
        # Process directly in DB session if server HTTP port is offline in isolated unit test environment
        process_payment_webhook(db, webhook_payload)

    return {
        "payment": payment,
        "gateway_response": gateway_result,
        "webhook_delivery": webhook_delivery,
    }


def retry_failed_payment(
    db: Session,
    payment_id: int,
):
    """
    M8 Requirement: Retry failed payments through Mock Payment Gateway.
    Only allows retrying payments with status 'FAILED'.
    """
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.is_deleted == False
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    if payment.payment_status in ["SUCCESS", "PAID"]:
        raise HTTPException(
            status_code=400,
            detail="Only FAILED payments can be retried. This payment is already SUCCESSFUL."
        )

    if payment.payment_status == "REFUNDED":
        raise HTTPException(
            status_code=400,
            detail="Refunded payments cannot be retried."
        )

    # Re-run Mock Payment Gateway processing
    gateway_result = PaymentGatewayService.process_payment(
        amount=payment.amount
    )

    # Update Payment Record
    payment.transaction_id = gateway_result["transaction_id"]
    payment.payment_status = gateway_result["payment_status"]
    payment.payment_date = date.today()
    payment.remarks = f"Payment retry completed: {gateway_result['response_message']}"

    db.commit()
    db.refresh(payment)

    if gateway_result["payment_status"] == "SUCCESS":
        mark_invoice_as_paid(
            db=db,
            subscription_id=payment.subscription_id,
            payment_date=date.today()
        )

    # Send Webhook POST request for retry result
    sub = db.query(Subscription).filter(Subscription.id == payment.subscription_id).first()
    inv = db.query(Invoice).filter(Invoice.subscription_id == payment.subscription_id).order_by(Invoice.id.desc()).first()

    customer_id = sub.customer_id if sub else 1
    invoice_id = inv.id if inv else 1

    status_str = "PAID" if gateway_result["payment_status"] == "SUCCESS" else "FAILED"
    event_type = "payment.paid" if status_str == "PAID" else "payment.failed"

    webhook_payload = PaymentWebhookPayload(
        invoice_id=invoice_id,
        customer_id=customer_id,
        transaction_id=gateway_result["transaction_id"],
        event_type=event_type,
        amount=payment.amount,
        status=status_str,
        timestamp=datetime.utcnow()
    )

    webhook_delivery = send_payment_webhook(webhook_payload)
    if not webhook_delivery.get("success"):
        process_payment_webhook(db, webhook_payload)

    return {
        "payment": _enrich_payment(db, payment),
        "gateway_response": gateway_result,
        "webhook_delivery": webhook_delivery,
    }