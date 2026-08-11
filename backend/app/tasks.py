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