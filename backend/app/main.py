import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

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
from app.models.retry import RetryConfiguration, RetryQueue
from app.models.tax import TaxMaster

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
from app.api.velora import router as velora_router
from app.api.retry import router as retry_router
from app.api.tax import router as tax_router
from app.api.pdf import router as pdf_router

from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Auto-migrate missing columns in PostgreSQL database
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS working_id VARCHAR(100);"))
        conn.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id);"))
        conn.commit()
except Exception as e:
    print(f"Database schema auto-migration notice: {e}")

app = FastAPI(
    title="Nexora - Recurring Payment, Subscription Management & Billing Automation API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "https://infosys-springboard-billing-automat.vercel.app",
        "http://localhost:5173",
        "http://localhost:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

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
app.include_router(velora_router)
app.include_router(retry_router)
app.include_router(tax_router)
app.include_router(pdf_router)
app.include_router(pdf_router, prefix="/api")
app.include_router(pdf_router, prefix="/api/v1")
app.include_router(retry_router, prefix="/api/v1")
app.include_router(tax_router, prefix="/api/v1")
app.include_router(billing_cycle_router, prefix="/api/v1")
app.include_router(billing_cycle_router, prefix="/api")


@app.on_event("startup")
def startup_event():
    try:
        from app.database.database import SessionLocal
        from app.services.billing_cycle_service import generate_due_invoices
        from app.services.retry_service import init_default_retry_configs
        from app.services.tax_service import init_default_tax_rules
        from app.services.user_service import init_default_users
        from app.services.customer_service import init_default_customers
        from app.services.plan_service import init_default_plans
        db = SessionLocal()
        init_default_users(db)
        init_default_customers(db)
        init_default_plans(db)
        generate_due_invoices(db)
        init_default_retry_configs(db)
        init_default_tax_rules(db)
        db.close()
    except Exception as e:
        print(f"Startup background task initialization notice: {e}")


@app.get("/")
def root():
    return {"message": "Nexora Billing Automation Platform API is running!"}