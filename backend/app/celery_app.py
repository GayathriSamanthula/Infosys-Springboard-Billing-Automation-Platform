from celery import Celery

celery_app = Celery(
    "billing_automation_platform",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=[
        "backend.app.tasks"
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
        "schedule": 60.0,
        }
    }
)