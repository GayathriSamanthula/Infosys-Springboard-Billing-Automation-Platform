from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.database import get_db
from app.services.tax_service import generate_tax_reports
from app.services.velora_service import (
    get_velora_merchant_info,
    get_velora_synced_plans,
    get_velora_synced_customers,
    get_velora_synced_subscriptions,
    get_velora_synced_invoices,
    get_velora_synced_payments,
    get_velora_synced_billing_cycles,
    get_velora_synced_audit_logs,
    get_velora_synced_notifications,
    get_velora_synced_retries,
    dispatch_velora_webhook
)

router = APIRouter(prefix="/velora", tags=["Velora Fintech Integration"])

@router.get("/merchant-info", summary="Velora Merchant Integration Status")
def read_merchant_info():
    """Retrieve Velora merchant API keys, integration status, and webhook configurations."""
    return get_velora_merchant_info()

@router.get("/plans", summary="Velora Synced Pricing Plans")
def read_velora_plans(db: Session = Depends(get_db)):
    """Retrieve exact Nexora subscription plans synced for Velora."""
    return get_velora_synced_plans(db)

@router.get("/customers", summary="Velora Synced Customer Directory")
def read_velora_customers(db: Session = Depends(get_db)):
    """Retrieve exact Nexora customers synced for Velora."""
    return get_velora_synced_customers(db)

@router.get("/subscriptions", summary="Velora Synced Subscriptions")
def read_velora_subscriptions(db: Session = Depends(get_db)):
    """Retrieve exact Nexora active subscriptions synced for Velora."""
    return get_velora_synced_subscriptions(db)

@router.get("/invoices", summary="Velora Synced Invoices")
def read_velora_invoices(db: Session = Depends(get_db)):
    """Retrieve exact Nexora billing invoices synced for Velora."""
    return get_velora_synced_invoices(db)

@router.get("/payments", summary="Velora Synced Payments")
def read_velora_payments(db: Session = Depends(get_db)):
    """Retrieve exact Nexora payment logs synced for Velora."""
    return get_velora_synced_payments(db)

@router.get("/billing-cycles", summary="Velora Synced Billing Cycles")
def read_velora_billing_cycles(db: Session = Depends(get_db)):
    """Retrieve Velora billing cycles strictly filtered for Velora."""
    return get_velora_synced_billing_cycles(db)

@router.get("/audit-logs", summary="Velora Synced Compliance Audit Logs")
def read_velora_audit_logs(db: Session = Depends(get_db)):
    """Retrieve exact Nexora compliance audit logs synced for Velora."""
    return get_velora_synced_audit_logs(db)

@router.get("/notifications", summary="Velora Synced Platform Notifications")
def read_velora_notifications(db: Session = Depends(get_db)):
    """Retrieve exact platform email and alert notifications synced for Velora."""
    return get_velora_synced_notifications(db)

@router.get("/retry-queue", summary="Velora Synced Dunning Retry Queue")
def read_velora_retries(db: Session = Depends(get_db)):
    return get_velora_synced_retries(db)

@router.get("/tax-reports", summary="Velora Synced Tax Compliance Reports")
def read_velora_tax_reports(period: str = "monthly", db: Session = Depends(get_db)):
    """Retrieve full 9-report tax compliance metrics synced for Velora merchants."""
    return generate_tax_reports(db, period=period)

@router.post("/webhook-trigger", summary="Trigger Real-Time Webhook Event & Email Notification")
def trigger_webhook(event_type: str = "subscription.created", payload: Dict[str, Any] = None):
    """Simulate real-time webhook payload dispatch to Velora/Nexora."""
    if not payload:
        payload = {
            "subscription_id": 3401,
            "status": "ACTIVE",
            "plan": "Premium Plan",
            "amount": 999.00,
            "customer_name": "Subscriber Account",
            "email": "customer@example.com"
        }
    return dispatch_velora_webhook(event_type, payload)
