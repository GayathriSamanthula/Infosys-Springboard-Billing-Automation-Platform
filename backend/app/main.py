from fastapi import FastAPI

from backend.app.database.database import Base, engine
from backend.app.models.user import User
from backend.app.models.plan import Plan
from backend.app.models.customer import Customer
from backend.app.models.subscription import Subscription
from backend.app.models.billing_cycle import BillingCycle
from backend.app.models.invoice import Invoice
from backend.app.models.payment import Payment
from backend.app.models.notification import Notification
from backend.app.api.auth import router as auth_router
from backend.app.api.plan import router as plan_router
from backend.app.api.customer import router as customer_router
from backend.app.api.subscription import router as subscription_router
from backend.app.api.payment import router as payment_router
from backend.app.api.invoice import router as invoice_router
from backend.app.api.billing_cycle import router as billing_cycle_router
from backend.app.api.notification import router as notification_router
from backend.app.api.audit_log import router as audit_log_router
from backend.app.api import billing_cycle

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth_router)
app.include_router(plan_router)
app.include_router(customer_router)
app.include_router(subscription_router)
app.include_router(payment_router)
app.include_router(invoice_router)
app.include_router(billing_cycle_router)
app.include_router(notification_router)
app.include_router(audit_log_router)

@app.get("/")
def root():
    return {"message": "Billing Automation Platform is running!"}