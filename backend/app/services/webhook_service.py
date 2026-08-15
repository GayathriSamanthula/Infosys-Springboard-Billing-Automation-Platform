from datetime import date, datetime
import json
import urllib.request
import urllib.error
import time
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.payment import Payment
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.retry import RetryQueue
from app.schemas.webhook import PaymentWebhookPayload, WebhookResponse
from app.services.notification_service import send_smart_email
from app.services.retry_service import schedule_retry

DEFAULT_WEBHOOK_URL = "http://127.0.0.1:8000/api/v1/payments/webhook"


def process_payment_webhook(db: Session, payload: PaymentWebhookPayload) -> WebhookResponse:
    """
    Handles incoming webhook notifications from Payment Gateway.
    Updates Invoice status, Subscription lifecycle status, and generates compliance Audit Logs.
    """
    invoice = None
    if payload.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()

    # Fallback 1: Lookup latest invoice for customer if invoice_id fails or is missing
    if not invoice and getattr(payload, 'customer_id', None):
        subs = db.query(Subscription).filter(Subscription.customer_id == payload.customer_id).all()
        sub_ids = [s.id for s in subs]
        if sub_ids:
            invoice = db.query(Invoice).filter(
                Invoice.subscription_id.in_(sub_ids),
                Invoice.is_deleted == False
            ).order_by(Invoice.id.desc()).first()

    # Fallback 2: Lookup via transaction_id in Payment table
    if not invoice and getattr(payload, 'transaction_id', None):
        existing_p = db.query(Payment).filter(Payment.transaction_id == payload.transaction_id).first()
        if existing_p and existing_p.invoice_id:
            invoice = db.query(Invoice).filter(Invoice.id == existing_p.invoice_id).first()

    if not invoice:
        return WebhookResponse(
            success=False,
            message=f"Invoice #{payload.invoice_id} not found.",
            invoice_id=payload.invoice_id or 0,
            invoice_status="UNKNOWN",
            subscription_status="UNKNOWN",
        )

    subscription = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first()
    if not subscription:
        return WebhookResponse(
            success=False,
            message=f"Subscription #{invoice.subscription_id} associated with invoice not found.",
            invoice_id=invoice.id,
            invoice_status=invoice.status,
            subscription_status="UNKNOWN",
        )

    status_str = payload.status.upper()
    event_str = payload.event_type.lower()

    # Locate or Create Payment Record (H2 Gap Implementation)
    payment = (
        db.query(Payment)
        .filter(Payment.transaction_id == payload.transaction_id)
        .first()
    )
    if not payment:
        payment = (
            db.query(Payment)
            .filter(Payment.subscription_id == subscription.id)
            .order_by(Payment.id.desc())
            .first()
        )

    payment_status_value = "SUCCESS" if status_str in ["PAID", "SUCCESS"] or "paid" in event_str else status_str

    if not payment:
        payment = Payment(
            subscription_id=subscription.id,
            amount=payload.amount,
            payment_method="Payment Webhook",
            transaction_id=payload.transaction_id,
            payment_date=date.today(),
            payment_status=payment_status_value,
            gateway_name="Mock Payment Gateway",
            remarks=f"Payment record created via webhook event '{payload.event_type}'",
        )
        db.add(payment)
    else:
        payment.payment_status = payment_status_value
        payment.payment_date = date.today()
        payment.transaction_id = payload.transaction_id
        payment.remarks = f"Payment status updated to '{payment_status_value}' via webhook event '{payload.event_type}'"

    if status_str in ["PAID", "SUCCESS"] or "paid" in event_str:
        # Payment Successful
        invoice.status = "PAID"
        invoice.payment_date = date.today()
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.activated_at = datetime.utcnow()

        # Cancel remaining pending retries for this invoice
        db.query(RetryQueue).filter(
            RetryQueue.invoice_id == invoice.id,
            RetryQueue.retry_status == "PENDING"
        ).update({"retry_status": "CANCELLED"})

        # Audit Log
        audit = AuditLog(
            event="PAYMENT_RECEIVED",
            performed_by="PAYMENT_GATEWAY",
            description=f"Payment of ${payload.amount} received. Transaction ID: {payload.transaction_id}"
        )
        db.add(audit)

        # Notification & Real HTML Email Dispatch
        notif = Notification(
            customer_id=payload.customer_id,
            notification_type="PAYMENT_SUCCESS",
            message=f"Payment of ${payload.amount} for Invoice #{invoice.invoice_number} was successful.",
            sent_date=date.today(),
            status="SENT",
            delivery_channel="EMAIL"
        )
        db.add(notif)

        # Trigger Smart HTML Email Dispatch
        customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
        if customer and customer.email:
            send_smart_email(
                to_email=customer.email,
                customer_name=customer.name,
                subject=f"Payment Receipt: Invoice #{invoice.invoice_number}",
                template_name="nexora_payment_success.html",
                context={
                    "invoice_number": invoice.invoice_number,
                    "transaction_id": payload.transaction_id,
                    "payment_date": str(date.today()),
                    "payment_method": "Payment Webhook",
                    "plan_name": f"Subscription #{subscription.id}",
                    "amount": str(payload.amount)
                },
                platform="NEXORA"
            )

    elif status_str in ["FAILED"] or "failed" in event_str:
        # Payment Failed
        invoice.status = "FAILED"
        subscription.status = SubscriptionStatus.PAST_DUE
        subscription.past_due_at = datetime.utcnow()

        # Automatically Schedule Attempt #1 in RetryQueue if no pending retry exists
        existing_retry = db.query(RetryQueue).filter(
            RetryQueue.invoice_id == invoice.id,
            RetryQueue.retry_status == "PENDING"
        ).first()

        if not existing_retry:
            schedule_retry(
                db=db,
                invoice_id=invoice.id,
                customer_id=payload.customer_id,
                attempt_number=1
            )

        # Audit Log
        audit = AuditLog(
            event="PAYMENT_FAILED",
            performed_by="PAYMENT_GATEWAY",
            description=f"Payment attempt failed for invoice {invoice.invoice_number}. Subscription marked PAST_DUE. Attempt #1 queued for retry."
        )
        db.add(audit)

        # Notification & Real HTML Email Dispatch
        notif = Notification(
            customer_id=payload.customer_id,
            notification_type="PAYMENT_FAILED",
            message=f"Payment failed for Invoice #{invoice.invoice_number}. Account marked PAST_DUE.",
            sent_date=date.today(),
            status="SENT",
            delivery_channel="EMAIL"
        )
        db.add(notif)

        # Trigger Smart HTML Email Dispatch
        customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
        if customer and customer.email:
            send_smart_email(
                to_email=customer.email,
                customer_name=customer.name,
                subject=f"Payment Action Required: Invoice #{invoice.invoice_number}",
                template_name="nexora_payment_failed.html",
                context={
                    "invoice_number": invoice.invoice_number,
                    "payment_date": str(date.today()),
                    "amount": str(payload.amount)
                },
                platform="NEXORA"
            )

    elif status_str in ["REFUNDED"] or "refunded" in event_str:
        # Payment Refunded
        invoice.status = "REFUNDED"

        audit = AuditLog(
            event="REFUND_ISSUED",
            performed_by="PAYMENT_GATEWAY",
            description=f"Refund issued for invoice {invoice.invoice_number}. Amount: ${payload.amount}"
        )
        db.add(audit)

    db.commit()
    db.refresh(invoice)
    db.refresh(subscription)
    db.refresh(payment)

    return WebhookResponse(
        success=True,
        message=f"Webhook processed successfully for event '{payload.event_type}'.",
        invoice_id=invoice.id,
        invoice_status=invoice.status,
        subscription_status=subscription.status.value if hasattr(subscription.status, 'value') else subscription.status,
    )


def send_payment_webhook(
    payload: PaymentWebhookPayload,
    webhook_url: Optional[str] = None,
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Sends an HTTP POST request to the Billing Webhook Endpoint.
    Uses standard library urllib.request for zero-dependency compatibility.
    Includes automated retry logic if HTTP POST request delivery fails.
    """
    target_url = webhook_url or DEFAULT_WEBHOOK_URL
    payload_data = payload.model_dump(mode="json")
    json_bytes = json.dumps(payload_data).encode("utf-8")

    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(
                target_url,
                data=json_bytes,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status in [200, 201]:
                    resp_body = json.loads(response.read().decode("utf-8"))
                    return {
                        "success": True,
                        "status_code": response.status,
                        "attempt": attempt,
                        "response": resp_body
                    }
        except Exception as err:
            print(f"Webhook delivery attempt {attempt} failed: {err}")
            if attempt < max_retries:
                time.sleep(0.5)

    return {
        "success": False,
        "status_code": 500,
        "attempt": max_retries,
        "error": "Failed to deliver webhook after maximum retry attempts."
    }
