from backend.app.models.customer import Customer
from backend.app.models.subscription import Subscription
from backend.app.models.plan import Plan
from backend.app.celery_app import celery_app
from backend.app.database.database import SessionLocal
from backend.app.services.subscription_service import process_due_subscription_renewals


@celery_app.task(name="subscription.process_renewals")
def process_subscription_renewals():
    """
    Background task that processes subscription renewals.
    """

    db = SessionLocal()

    try:
        processed = process_due_subscription_renewals(db)
        print("Processed value:", processed)
        print("Processed type:", type(processed))
        # TODO: After implementing invoice_service.generate_invoice(),
        # automatically generate invoices for successfully renewed subscriptions.

        return {
            "status": "success",
            "processed_subscriptions": processed,
            "count": len(processed)
        }

    finally:
        db.close()