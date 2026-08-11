from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.models.retry import RetryConfiguration, RetryQueue
from app.models.invoice import Invoice
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.services.notification_service import send_smart_email
from app.services.payment_gateway_service import PaymentGatewayService
from app.schemas.retry import RetryConfigCreate, RetryConfigResponse


def init_default_retry_configs(db: Session):
    """
    Seeds default failed payment retry schedule configuration rules if not present.
    Default Rules:
    - Attempt 1: Wait 1 Day
    - Attempt 2: Wait 3 Days
    - Attempt 3: Wait 7 Days
    0 existing records modified or erased.
    """
    defaults = [
        {"retry_attempt": 1, "retry_after_days": 1},
        {"retry_attempt": 2, "retry_after_days": 3},
        {"retry_attempt": 3, "retry_after_days": 7},
    ]

    for item in defaults:
        existing = db.query(RetryConfiguration).filter(
            RetryConfiguration.retry_attempt == item["retry_attempt"]
        ).first()
        if not existing:
            config = RetryConfiguration(
                retry_attempt=item["retry_attempt"],
                retry_after_days=item["retry_after_days"],
                is_active=True
            )
            db.add(config)
    db.commit()


def get_retry_configs(db: Session) -> List[RetryConfiguration]:
    """Returns active retry configuration rules ordered by attempt number."""
    init_default_retry_configs(db)
    return db.query(RetryConfiguration).filter(
        RetryConfiguration.is_active == True
    ).order_by(RetryConfiguration.retry_attempt.asc()).all()


CATEGORIZED_FAILURE_REASONS = [
    "Insufficient balance / Card declined",
    "Expired card / Auth failure",
    "Temporary bank issue / Gateway timeout",
    "Network issue / Connection reset",
    "Customer forgot to update payment method"
]


def schedule_retry(
    db: Session,
    invoice_id: int,
    customer_id: int,
    attempt_number: int = 1,
    failure_reason: Optional[str] = None
) -> Optional[RetryQueue]:
    """
    Schedules a failed payment retry attempt in the queue based on configured rules.
    """
    init_default_retry_configs(db)
    config = db.query(RetryConfiguration).filter(
        RetryConfiguration.retry_attempt == attempt_number,
        RetryConfiguration.is_active == True
    ).first()

    if not config:
        print(f"[Retry Scheduler] No active config rule found for attempt #{attempt_number}.")
        return None

    # Calculate scheduled retry date
    now = datetime.utcnow()
    scheduled_date = now + timedelta(days=config.retry_after_days)

    # Check if next attempt rule exists
    next_config = db.query(RetryConfiguration).filter(
        RetryConfiguration.retry_attempt == attempt_number + 1,
        RetryConfiguration.is_active == True
    ).first()
    next_retry_date = now + timedelta(days=config.retry_after_days + (next_config.retry_after_days if next_config else 0)) if next_config else None

    # Assign categorized failure reason
    assigned_reason = failure_reason or CATEGORIZED_FAILURE_REASONS[(attempt_number - 1) % len(CATEGORIZED_FAILURE_REASONS)]

    retry_entry = RetryQueue(
        invoice_id=invoice_id,
        customer_id=customer_id,
        retry_attempt=attempt_number,
        scheduled_retry_date=scheduled_date,
        retry_status="PENDING",
        failure_reason=assigned_reason,
        next_retry_date=next_retry_date,
        created_at=now
    )
    db.add(retry_entry)
    db.commit()
    db.refresh(retry_entry)

    # Audit Log
    audit = AuditLog(
        event="RETRY_SCHEDULED",
        performed_by="RETRY_ENGINE",
        description=f"Retry Attempt #{attempt_number} scheduled for Invoice #{invoice_id} on {scheduled_date.strftime('%Y-%m-%d %H:%M:%S')}. Reason: {assigned_reason}."
    )
    db.add(audit)
    db.commit()

    print(f"[Retry Engine] Retry Attempt #{attempt_number} scheduled for Invoice #{invoice_id} on {scheduled_date}")
    return retry_entry


def process_due_retries(db: Session) -> Dict[str, Any]:
    """
    Processes all PENDING failed payment retries that are scheduled for execution.
    Handles payment simulation, state machine updates, email dispatch, and audit logging.
    """
    init_default_retry_configs(db)
    now = datetime.utcnow()

    due_items = db.query(RetryQueue).filter(
        RetryQueue.retry_status == "PENDING",
        RetryQueue.scheduled_retry_date <= now
    ).all()

    processed_count = len(due_items)
    success_count = 0
    failed_count = 0
    details = []

    for item in due_items:
        invoice = db.query(Invoice).filter(Invoice.id == item.invoice_id).first()
        subscription = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first() if invoice else None
        customer = db.query(Customer).filter(Customer.id == item.customer_id).first()

        if not invoice or not customer:
            continue

        item.actual_retry_date = now

        # Execute dynamic Payment Gateway simulation call for payment retry
        target_amount = float(getattr(invoice, 'amount', 0.0) or getattr(invoice, 'total_amount', 0.0) or 0.0)
        gateway_res = PaymentGatewayService.simulate_payment(
            subscription_id=subscription.id if subscription else 0,
            amount=target_amount,
            payment_method="Automated Retry Gateway"
        )
        is_success = (gateway_res.status.upper() == "SUCCESS")

        if is_success:
            success_count += 1
            item.retry_status = "SUCCESS"
            invoice.status = "PAID"
            invoice.payment_date = datetime.utcnow().date()

            if subscription:
                subscription.status = SubscriptionStatus.ACTIVE
                subscription.activated_at = now

            # Cancel remaining pending retries for this invoice
            db.query(RetryQueue).filter(
                RetryQueue.invoice_id == item.invoice_id,
                RetryQueue.retry_status == "PENDING",
                RetryQueue.retry_id != item.retry_id
            ).update({"retry_status": "CANCELLED"})

            # Audit Log
            audit = AuditLog(
                event="RETRY_SUCCESSFUL",
                performed_by="RETRY_ENGINE",
                description=f"Retry Attempt #{item.retry_attempt} succeeded for Invoice #{invoice.invoice_number}. Subscription marked ACTIVE."
            )
            db.add(audit)

            # Notification
            notif = Notification(
                customer_id=customer.id,
                notification_type="RETRY_SUCCESSFUL",
                message=f"Retry Attempt #{item.retry_attempt} for Invoice #{invoice.invoice_number} succeeded.",
                sent_date=datetime.utcnow().date(),
                status="SENT",
                delivery_channel="EMAIL"
            )
            db.add(notif)

            # Dispatch HTML Email
            send_smart_email(
                to_email=customer.email,
                customer_name=customer.full_name,
                subject=f"Payment Retry Succeeded: Invoice #{invoice.invoice_number}",
                template_name="nexora_payment_success.html",
                context={
                    "invoice_number": invoice.invoice_number,
                    "transaction_id": f"tx_retry_{item.retry_id}",
                    "payment_date": str(datetime.utcnow().date()),
                    "payment_method": "Automated Retry Gateway",
                    "plan_name": f"Subscription #{subscription.id if subscription else ''}",
                    "amount": f"{float(getattr(invoice, 'amount', 0.0) or getattr(invoice, 'total_amount', 0.0)):.2f}"
                },
                platform="NEXORA"
            )

            details.append({
                "retry_id": item.retry_id,
                "invoice_id": item.invoice_id,
                "attempt": item.retry_attempt,
                "result": "SUCCESS",
                "message": "Payment succeeded on retry attempt."
            })
        else:
            failed_count += 1
            item.retry_status = "FAILED"
            item.failure_reason = item.failure_reason or CATEGORIZED_FAILURE_REASONS[(item.retry_attempt - 1) % len(CATEGORIZED_FAILURE_REASONS)]

            # Check if next attempt exists
            next_attempt_num = item.retry_attempt + 1
            next_config = db.query(RetryConfiguration).filter(
                RetryConfiguration.retry_attempt == next_attempt_num,
                RetryConfiguration.is_active == True
            ).first()

            if next_config:
                # Schedule Next Retry
                schedule_retry(db, item.invoice_id, item.customer_id, attempt_number=next_attempt_num)
                audit = AuditLog(
                    event="RETRY_FAILED_NEXT_SCHEDULED",
                    performed_by="RETRY_ENGINE",
                    description=f"Retry Attempt #{item.retry_attempt} failed. Attempt #{next_attempt_num} scheduled."
                )
                db.add(audit)
            else:
                # Final Attempt Failed -> Cancel Subscription
                if subscription:
                    subscription.status = SubscriptionStatus.CANCELLED
                    subscription.cancelled_at = now

                audit = AuditLog(
                    event="SUBSCRIPTION_CANCELLED_RETRY_EXHAUSTED",
                    performed_by="RETRY_ENGINE",
                    description=f"All retry attempts exhausted for Invoice #{invoice.invoice_number}. Subscription CANCELLED."
                )
                db.add(audit)

                # Cancellation Email Notification
                send_smart_email(
                    to_email=customer.email,
                    customer_name=customer.full_name,
                    subject=f"Subscription Cancelled: Payment Retry Exhausted",
                    template_name="nexora_payment_failed.html",
                    context={
                        "invoice_number": invoice.invoice_number,
                        "payment_date": str(datetime.utcnow().date()),
                        "amount": f"{float(getattr(invoice, 'amount', 0.0) or getattr(invoice, 'total_amount', 0.0)):.2f}"
                    },
                    platform="NEXORA"
                )

            details.append({
                "retry_id": item.retry_id,
                "invoice_id": item.invoice_id,
                "attempt": item.retry_attempt,
                "result": "FAILED",
                "message": "Payment failed on retry attempt."
            })

    db.commit()
    return {
        "processed_count": processed_count,
        "success_count": success_count,
        "failed_count": failed_count,
        "details": details
    }


def get_retry_queue(db: Session, status_filter: Optional[str] = None, customer_id: Optional[int] = None) -> List[RetryQueue]:
    """Returns retry queue entries filterable by status or customer ID."""
    init_default_retry_configs(db)
    query = db.query(RetryQueue)
    if status_filter:
        query = query.filter(RetryQueue.retry_status == status_filter.upper())
    if customer_id:
        query = query.filter(RetryQueue.customer_id == customer_id)
    return query.order_by(RetryQueue.created_at.desc()).all()
