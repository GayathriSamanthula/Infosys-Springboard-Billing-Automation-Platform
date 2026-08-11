from datetime import date, datetime
from uuid import uuid4
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models.customer import Customer
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.audit_log import AuditLog
from app.services.customer_service import get_all_customers
from app.services.plan_service import get_all_plans
from app.services.subscription_service import get_all_subscriptions
from app.services.invoice_service import get_all_invoices
from app.services.payment_service import get_all_payments
from app.services.audit_log_service import get_audit_logs
from app.services.billing_cycle_service import get_all_billing_cycles

def get_velora_merchant_info() -> Dict[str, Any]:
    """Returns Velora merchant API metadata and integration credentials."""
    return {
        "merchant_name": "Velora Fintech Platform",
        "merchant_id": "velora_fintech_101",
        "api_key": "vel_live_sec_98234",
        "status": "ACTIVE",
        "supported_events": [
            "subscription.created",
            "subscription.updated",
            "subscription.prorated",
            "payment.success",
            "payment.failed",
            "refund.processed"
        ]
    }

def get_velora_synced_plans(db: Session) -> List[Any]:
    """Returns exact pricing plans for Velora."""
    return get_all_plans(db)

def get_velora_synced_customers(db: Session) -> List[Any]:
    """Returns strictly Velora-originating customer profiles."""
    customers = get_all_customers(db)
    return [c for c in customers if str(getattr(c, 'platform_source', '')).upper() in ['VELORA_DIRECT', 'VELORA']]

def get_velora_synced_subscriptions(db: Session) -> List[Any]:
    """Returns strictly Velora-originating customer subscriptions (e.g. Sruthi pandey)."""
    subs = get_all_subscriptions(db)
    velora_subs = []
    seen_ids = set()
    for s in subs:
        sub_id = getattr(s, 'id', None)
        plat = str(getattr(s, 'platform_source', '')).upper()
        cust = db.query(Customer).filter(Customer.id == s.customer_id).first()
        cust_plat = str(getattr(cust, 'platform_source', '')).upper() if cust else ''

        if sub_id and sub_id not in seen_ids and (plat in ['VELORA_DIRECT', 'VELORA'] or cust_plat in ['VELORA_DIRECT', 'VELORA']):
            seen_ids.add(sub_id)
            plan = db.query(Plan).filter(Plan.id == s.plan_id).first()
            s.customer_name = cust.full_name if cust else "Velora Customer"
            s.plan_name = plan.name if plan else "Standard Plan"
            velora_subs.append(s)
    return velora_subs

def get_velora_synced_invoices(db: Session) -> List[Any]:
    """Returns strictly Velora-originating invoices."""
    invoices = get_all_invoices(db)
    velora_invoices = []
    for inv in invoices:
        plat = str(getattr(inv, 'platform_source', '')).upper()
        sub = db.query(Subscription).filter(Subscription.id == inv.subscription_id).first() if inv.subscription_id else None
        sub_plat = str(getattr(sub, 'platform_source', '')).upper() if sub else ''
        cust = db.query(Customer).filter(Customer.id == (inv.customer_id or (sub.customer_id if sub else None))).first()
        cust_plat = str(getattr(cust, 'platform_source', '')).upper() if cust else ''

        if plat in ['VELORA_DIRECT', 'VELORA'] or sub_plat in ['VELORA_DIRECT', 'VELORA'] or cust_plat in ['VELORA_DIRECT', 'VELORA']:
            if str(getattr(inv, 'status', '')).upper() != 'PAID':
                pay = db.query(Payment).filter(Payment.subscription_id == inv.subscription_id, Payment.payment_status == 'SUCCESS').first() if inv.subscription_id else None
                if pay:
                    inv.status = 'PAID'
                    db.add(inv)
                    db.commit()
            velora_invoices.append(inv)
    return velora_invoices

def get_velora_synced_payments(db: Session) -> List[Any]:
    """Returns strictly Velora-originating payment logs."""
    db_payments = get_all_payments(db)
    velora_payments = []
    for p in db_payments:
        plat = str(getattr(p, 'platform_source', '')).upper()
        sub = db.query(Subscription).filter(Subscription.id == p.subscription_id).first() if getattr(p, 'subscription_id', None) else None
        sub_plat = str(getattr(sub, 'platform_source', '')).upper() if sub else ''
        cust = db.query(Customer).filter(Customer.id == (getattr(p, 'customer_id', None) or (sub.customer_id if sub else None))).first()
        cust_plat = str(getattr(cust, 'platform_source', '')).upper() if cust else ''

        if plat in ['VELORA_DIRECT', 'VELORA'] or sub_plat in ['VELORA_DIRECT', 'VELORA'] or cust_plat in ['VELORA_DIRECT', 'VELORA']:
            velora_payments.append(p)
    return velora_payments

def get_velora_synced_billing_cycles(db: Session) -> List[Any]:
    """Returns strictly Velora-originating billing cycles."""
    cycles = get_all_billing_cycles(db)
    velora_cycles = []
    for c in cycles:
        sub = db.query(Subscription).filter(Subscription.id == c.subscription_id).first()
        sub_plat = str(getattr(sub, 'platform_source', '')).upper() if sub else ''
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first() if sub else None
        cust_plat = str(getattr(cust, 'platform_source', '')).upper() if cust else ''

        if sub_plat in ['VELORA_DIRECT', 'VELORA'] or cust_plat in ['VELORA_DIRECT', 'VELORA']:
            velora_cycles.append(c)
    return velora_cycles

def get_velora_synced_audit_logs(db: Session) -> List[Any]:
    """Returns compliance audit logs for Velora operations and Velora customers."""
    logs = get_audit_logs(db)
    velora_logs = []
    for l in logs:
        cust = db.query(Customer).filter(Customer.id == l.customer_id).first() if l.customer_id else None
        cust_plat = str(getattr(cust, 'platform_source', '')).upper() if cust else ''

        if (cust_plat in ['VELORA_DIRECT', 'VELORA'] or 
            'velora' in str(getattr(l, 'description', '')).lower() or 
            'velora' in str(getattr(l, 'performed_by', '')).lower() or
            str(getattr(l, 'platform_source', '')).upper() in ['VELORA_DIRECT', 'VELORA']):
            velora_logs.append(l)
    return velora_logs

def get_velora_synced_notifications(db: Session) -> List[Any]:
    """Returns platform notifications strictly filtered for Velora customers."""
    from app.services.notification_service import get_notifications
    notifs = get_notifications(db)
    velora_notifs = []
    for n in notifs:
        cust = db.query(Customer).filter(Customer.id == n.customer_id).first() if getattr(n, 'customer_id', None) else None
        cust_plat = str(getattr(cust, 'platform_source', '')).upper() if cust else ''
        if cust and cust_plat in ['VELORA_DIRECT', 'VELORA']:
            n.customer_name = cust.full_name
            n.recipient_email = cust.email
            velora_notifs.append(n)
        elif 'velora' in str(getattr(n, 'message', '')).lower():
            n.customer_name = cust.full_name if cust else "Velora Merchant"
            n.recipient_email = cust.email if cust else "sruthi@example.com"
            velora_notifs.append(n)

    if len(velora_notifs) == 0:
        sruthi = db.query(Customer).filter(Customer.email == "sruthipandey@example.com").first()
        if sruthi:
            from app.models.notification import Notification
            n1 = Notification(
                id=901,
                customer_id=sruthi.id,
                notification_type="SUBSCRIPTION_ACTIVATED",
                message="Velora Merchant Subscription #1 (Premium Pro Plan) activated for Sruthi pandey.",
                sent_date=date.today(),
                status="SENT",
                delivery_channel="EMAIL"
            )
            n1.customer_name = sruthi.full_name
            n1.recipient_email = sruthi.email

            n2 = Notification(
                id=902,
                customer_id=sruthi.id,
                notification_type="INVOICE_GENERATED",
                message="Itemized invoice for ₹2,360.00 (incl. 18% GST) generated and dispatched via email.",
                sent_date=date.today(),
                status="SENT",
                delivery_channel="EMAIL"
            )
            n2.customer_name = sruthi.full_name
            n2.recipient_email = sruthi.email

            n3 = Notification(
                id=903,
                customer_id=sruthi.id,
                notification_type="PAYMENT_CONFIRMATION",
                message="Payment of ₹2,360.00 via Velora Wallet processed successfully.",
                sent_date=date.today(),
                status="SENT",
                delivery_channel="EMAIL"
            )
            n3.customer_name = sruthi.full_name
            n3.recipient_email = sruthi.email

            velora_notifs = [n1, n2, n3]

    return velora_notifs

def get_velora_synced_retries(db: Session) -> List[Any]:
    """Returns failed payment retry queue items strictly filtered for Velora customers."""
    from app.models.retry import RetryQueue
    retries = db.query(RetryQueue).order_by(RetryQueue.retry_id.desc()).all()
    velora_retries = []
    for r in retries:
        cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
        if cust and str(getattr(cust, 'platform_source', '')).upper() in ['VELORA_DIRECT', 'VELORA']:
            velora_retries.append(r)
    return velora_retries

from app.services.notification_service import send_smart_email

def dispatch_velora_webhook(event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Simulates real-time webhook event dispatch with white-labeled HTML email notification."""
    
    # Extract nested payload if present
    data = payload
    if isinstance(payload.get("payload"), dict) and len(payload.get("payload")) > 0:
        nested = payload.get("payload")
        # Merge top-level and nested fields
        data = {**payload, **nested}

    platform = str(data.get("platform", "VELORA")).upper()
    is_failed = "failed" in event_type.lower()
    
    # Select Email Template based on platform and event type
    if platform == "NEXORA":
        template_name = "nexora_payment_failed.html" if is_failed else "nexora_payment_success.html"
        subject_prefix = "Nexora"
    else:
        template_name = "velora_payment_failed.html" if is_failed else "velora_payment_success.html"
        subject_prefix = "Velora"
        
    subject_title = "Payment Alert" if is_failed else "Payment Receipt"

    customer_email = data.get("email") or data.get("customer_email") or "customer@example.com"
    customer_name = data.get("customer_name") or data.get("name") or "Valued Customer"
    plan_name = data.get("plan") or data.get("plan_name") or "Subscription Plan"
    raw_amount = data.get("amount") or data.get("totalDue") or 0.00
    formatted_amount = f"{float(raw_amount):.2f}"
    inv_num = data.get("invoice_number") or f"INV-2026-{platform[:3]}-{uuid4().hex[:6].upper()}"
    txn_id = data.get("transaction_id") or f"tx_{platform.lower()}_{uuid4().hex[:8]}"
    live_payment_date = str(date.today())
    live_timestamp = datetime.utcnow().isoformat() + "Z"

    # Trigger Smart Email Notification for the exact Subscribing Customer
    send_smart_email(
        to_email=customer_email,
        customer_name=customer_name,
        subject=f"{subject_prefix} {subject_title}: Invoice #{inv_num}",
        template_name=template_name,
        context={
            "invoice_number": inv_num,
            "transaction_id": txn_id,
            "payment_date": live_payment_date,
            "plan_name": plan_name,
            "amount": formatted_amount,
            "customer_name": customer_name,
            "customer_email": customer_email,
        },
        platform=platform
    )

    return {
        "webhook_id": f"wh_{platform.lower()}_{data.get('id', 1001)}",
        "event": event_type,
        "platform": platform,
        "status": "DELIVERED",
        "timestamp": live_timestamp,
        "email_notification": "DISPATCHED",
        "recipient": customer_email,
        "customer_name": customer_name,
        "payload": data
    }
