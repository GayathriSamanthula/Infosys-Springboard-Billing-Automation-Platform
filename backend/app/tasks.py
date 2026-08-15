from app.models.customer import Customer
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.celery_app import celery_app
from app.database.database import SessionLocal
from app.services.subscription_service import process_due_subscription_renewals
from app.services.billing_cycle_service import generate_due_invoices
from app.services.retry_service import process_due_retries


@celery_app.task(name="subscription.process_renewals")
def process_subscription_renewals():
    """
    Background task that processes subscription renewals automatically.
    """
    db = SessionLocal()
    try:
        processed = process_due_subscription_renewals(db)
        return {
            "status": "success",
            "processed_subscriptions": processed,
            "count": len(processed)
        }
    finally:
        db.close()


@celery_app.task(name="billing.generate_due_invoices")
def generate_due_billing_invoices():
    """
    Background task that generates due invoices for active subscriptions automatically.
    """
    db = SessionLocal()
    try:
        res = generate_due_invoices(db)
        return {
            "status": "success",
            "result": res
        }
    finally:
        db.close()


@celery_app.task(name="dunning.process_due_retries")
def process_dunning_due_retries():
    """
    Background task that automatically executes due failed payment retries.
    """
    db = SessionLocal()
    try:
        res = process_due_retries(db)
        return {
            "status": "success",
            "processed_result": res
        }
    finally:
        db.close()


@celery_app.task(name="billing.reconcile_unpaid_invoices")
def reconcile_unpaid_invoices_task():
    """
    Background task that periodically reconciles UNPAID invoices against successful payment records.
    Catches and fixes any missed or delayed webhook notifications automatically.
    """
    from app.models.invoice import Invoice
    from app.models.payment import Payment
    from sqlalchemy import or_
    from datetime import date

    db = SessionLocal()
    try:
        unpaid_invoices = db.query(Invoice).filter(Invoice.status != 'PAID', Invoice.is_deleted == False).all()
        reconciled_count = 0
        for inv in unpaid_invoices:
            successful_payment = db.query(Payment).filter(
                or_(Payment.invoice_id == inv.id, Payment.subscription_id == inv.subscription_id),
                Payment.payment_status == 'SUCCESS',
                Payment.is_deleted == False
            ).first()

            if successful_payment:
                inv.status = 'PAID'
                if not inv.payment_date and successful_payment.payment_date:
                    inv.payment_date = successful_payment.payment_date
                reconciled_count += 1

        if reconciled_count > 0:
            db.commit()

        return {
            "status": "success",
            "reconciled_count": reconciled_count
        }
    finally:
        db.close()