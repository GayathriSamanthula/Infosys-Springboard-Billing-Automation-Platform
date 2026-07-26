import os
from celery import Celery

BROKER_URL = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"))
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"))

celery_app = Celery(
    "billing_automation_platform",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=[
        "app.tasks"
    ]
)

celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=False,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    beat_schedule={
        "subscription-renewal-scheduler": {
            "task": "subscription.process_renewals",
            "schedule": 60.0,  # Runs every 60 seconds
        },
        "billing-cycle-invoice-scheduler": {
            "task": "billing.generate_due_invoices",
            "schedule": 60.0,  # Runs every 60 seconds
        }
    }
)