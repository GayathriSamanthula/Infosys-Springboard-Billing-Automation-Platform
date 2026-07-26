from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine
from app.models.user import User
from app.models.plan import Plan
from app.models.customer import Customer
from app.models.subscription import Subscription
from app.models.billing_cycle import BillingCycle
from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.notification import Notification

from app.api.auth import router as auth_router
from app.api.plan import router as plan_router
from app.api.customer import router as customer_router
from app.api.subscription import router as subscription_router
from app.api.payment import router as payment_router
from app.api.invoice import router as invoice_router
from app.api.billing_cycle import router as billing_cycle_router
from app.api.notification import router as notification_router
from app.api.audit_log import router as audit_log_router
from app.api.proration import router as proration_router
from app.api.webhook import router as webhook_router
from app.api.refund import router as refund_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nexora - Recurring Payment, Subscription Management & Billing Automation API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(plan_router)
app.include_router(customer_router)
app.include_router(subscription_router)
app.include_router(payment_router)
app.include_router(invoice_router)
app.include_router(billing_cycle_router)
app.include_router(notification_router)
app.include_router(audit_log_router)
app.include_router(proration_router)
app.include_router(webhook_router)
app.include_router(refund_router)


@app.on_event("startup")
def startup_event():
    try:
        from app.database.database import SessionLocal
        from app.services.billing_cycle_service import generate_due_invoices
        db = SessionLocal()
        generate_due_invoices(db)
        db.close()
    except Exception as e:
        print(f"Startup background task initialization notice: {e}")


@app.get("/")
def root():
    return {"message": "Nexora Billing Automation Platform API is running!"}