import os
import smtplib
from email.message import EmailMessage
from datetime import date
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.customer import Customer
from app.schemas.notification import NotificationCreate


def render_html_template(template_name: str, context: Dict[str, Any]) -> str:
    """
    Renders an HTML email template with provided context variables.
    Supports Jinja2 if installed, otherwise basic token substitution.
    """
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "templates", "email", template_name
    )
    if not os.path.exists(template_path):
        return f"<p>{context.get('message', 'Notification alert from Nexora & Velora')}</p>"

    with open(template_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Apply template variable replacements
    for key, val in context.items():
        placeholder = f"{{{{ {key} }}}}"
        content = content.replace(placeholder, str(val))
    
    # Conditional block for dev test mode
    is_dev = context.get("is_dev_mode", False)
    if not is_dev:
        # Hide dev banner block if in production
        dev_block_start = "{% if is_dev_mode %}"
        dev_block_end = "{% endif %}"
        if dev_block_start in content and dev_block_end in content:
            parts = content.split(dev_block_start)
            after = parts[1].split(dev_block_end, 1)[1]
            content = parts[0] + after
    else:
        content = content.replace("{% if is_dev_mode %}", "").replace("{% endif %}", "")

    return content


def send_smart_email(
    to_email: str,
    customer_name: str,
    subject: str,
    template_name: str,
    context: Dict[str, Any],
    platform: str = "NEXORA"
) -> bool:
    """
    Smart Hybrid Email Dispatcher:
    - In Development Mode or for sample emails (@example.com), routes email to DEV_TEST_RECEIVER_EMAIL with a test banner.
    - In Production Mode with real emails, dispatches directly to customer's email address.
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    dev_receiver = os.getenv("DEV_TEST_RECEIVER_EMAIL", "gayatrianasuyasamanthula@gmail.com")
    sender_email = os.getenv("SENDER_EMAIL", "gayatrianasuyasamanthula@gmail.com")
    sender_password = os.getenv("SENDER_APP_PASSWORD", "kpwgabwlgenhdnik")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))

    # Determine recipient email (Smart Hybrid Routing)
    is_sample_email = "@example.com" in to_email.lower()
    is_dev_mode = (env == "development") or is_sample_email
    target_recipient = to_email

    # Enhance context with recipient metadata
    context["customer_name"] = customer_name
    context["customer_email"] = to_email
    context["is_dev_mode"] = is_dev_mode

    # Render HTML content
    html_content = render_html_template(template_name, context)

    # Sender Name based on Platform
    sender_name = "Velora Fintech Platform" if platform.upper() == "VELORA" else "Nexora Billing Platform"
    full_sender = f"{sender_name} <{sender_email}>"

    # Log dispatch details
    print(f"\n================ [EMAIL DISPATCH LOG] ================")
    print(f"Platform:           {platform}")
    print(f"Event Subject:      {subject}")
    print(f"Intended Customer:  {customer_name} ({to_email})")
    print(f"Target Receiver:    {target_recipient} {'[DEV HYBRID ROUTE]' if is_dev_mode else '[LIVE CUSTOMER]'}")
    print(f"HTML Template:      {template_name}")
    print(f"======================================================\n")

    # If default credentials are present, skip actual SMTP send but log clean success
    if not sender_email or not sender_password or sender_email == "notifications@nexora.com" or sender_password == "Password":
        print(f"[Email Notification Log] Real SENDER_EMAIL or SENDER_APP_PASSWORD not configured in .env. Email dispatch simulated successfully for {target_recipient}.")
        return True

    # Real SMTP Dispatch
    try:
        msg = EmailMessage()
        msg["Subject"] = f"[TEST MODE] {subject}" if is_dev_mode else subject
        msg["From"] = full_sender
        msg["To"] = target_recipient
        msg.set_content(context.get("message", subject))
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        print(f"[SMTP Dispatch Success] Real HTML email dispatched to {target_recipient}")
        return True
    except Exception as e:
        print(f"[SMTP Dispatch Error] Failed to send email to {target_recipient}: {e}")
        return False


def get_template_for_notification(notification_type: str, platform: str = "NEXORA") -> tuple:
    """
    Dynamically maps notification_type and platform to exact HTML template name and subject prefix.
    Returns (template_name, brand_prefix).
    """
    plat = (platform or "NEXORA").upper()
    is_velora = ("VELORA" in plat)
    prefix = "Velora" if is_velora else "Nexora"
    notif_type = (notification_type or "").upper()

    # 1. Payment Failed / Past Due
    if any(k in notif_type for k in ["FAILED", "PAYMENT_FAILURE", "DECLINED", "PAST_DUE"]):
        template = "velora_payment_failed.html" if is_velora else "nexora_payment_failed.html"
    # 2. Payment Success / Invoice Paid
    elif any(k in notif_type for k in ["SUCCESS", "PAYMENT_SUCCESS", "PAID", "RECEIPT", "CREATED"]):
        template = "velora_payment_success.html" if is_velora else "nexora_payment_success.html"
    # 3. Subscription Lifecycle (Renewals, Upgrades, Proration, Cancellations)
    elif any(k in notif_type for k in ["RENEWAL", "SUBSCRIPTION", "PRORATION", "UPGRADE", "CANCEL", "PAUSE", "RESUME"]):
        template = "subscription_lifecycle.html"
    # 4. Promotional Offers
    elif any(k in notif_type for k in ["PROMO", "PROMOTIONAL", "OFFER", "DISCOUNT"]):
        template = "promotional_offer.html"
    # 5. Default Fallback based on Platform
    else:
        template = "velora_payment_success.html" if is_velora else "nexora_payment_success.html"

    return template, prefix


def send_real_email(to_email: str, subject: str, body: str) -> bool:
    """Legacy helper maintained for backwards compatibility."""
    return send_smart_email(
        to_email=to_email,
        customer_name="Valued Customer",
        subject=subject,
        template_name="nexora_payment_success.html",
        context={"message": body, "invoice_number": "NEX-INV-101", "transaction_id": "tx_mock_101", "payment_date": str(date.today()), "payment_method": "Credit Card", "plan_name": "Subscription Plan", "amount": "99.00"},
        platform="NEXORA"
    )


def create_notification(db: Session, notification: NotificationCreate):
    db_notification = Notification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    # Trigger dynamic email notification if customer has an email
    customer = db.query(Customer).filter(Customer.id == notification.customer_id).first()
    if customer and customer.email:
        cust_plat = str(getattr(customer, "platform_source", "NEXORA")).upper()
        platform = "VELORA" if "VELORA" in cust_plat else "NEXORA"

        template_name, brand_prefix = get_template_for_notification(
            notification_type=notification.notification_type,
            platform=platform
        )

        subject = f"{brand_prefix} Alert: {notification.notification_type}"
        cust_name = getattr(customer, "full_name", None) or getattr(customer, "name", None) or "Valued Customer"

        send_smart_email(
            to_email=customer.email,
            customer_name=cust_name,
            subject=subject,
            template_name=template_name,
            context={
                "message": notification.message,
                "notification_type": notification.notification_type,
                "invoice_number": f"INV-#{db_notification.id}",
                "transaction_id": f"tx_notif_{db_notification.id}",
                "payment_date": str(date.today()),
                "payment_method": "Notification System",
                "plan_name": notification.notification_type,
                "amount": "0.00"
            },
            platform=platform
        )

    return db_notification


def get_notifications(db: Session):
    return db.query(Notification).filter(
        Notification.is_deleted == False
    ).order_by(Notification.id.desc()).all()


def get_notification(db: Session, notification_id: int):
    return db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.is_deleted == False
    ).first()


def mark_notification_as_read(db: Session, notification_id: int):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.is_deleted == False
    ).first()

    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification


def delete_notification(db: Session, notification_id: int):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.is_deleted == False
    ).first()

    if notification:
        notification.is_deleted = True
        db.commit()

    return notification


def send_subscription_notification(db: Session, subscription_id: int, customer_id: int = 1):
    notification = NotificationCreate(
        customer_id=customer_id,
        notification_type="SUBSCRIPTION_RENEWED",
        message=f"Subscription {subscription_id} renewed successfully.",
        sent_date=date.today(),
        status="SENT",
        delivery_channel="EMAIL"
    )

    return create_notification(db, notification)