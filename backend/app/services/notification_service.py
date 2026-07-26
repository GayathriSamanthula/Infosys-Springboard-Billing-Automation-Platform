import os
import smtplib
from email.message import EmailMessage
from datetime import date
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.customer import Customer
from app.schemas.notification import NotificationCreate


def send_real_email(to_email: str, subject: str, body: str) -> bool:
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_APP_PASSWORD")

    if not sender_email or not sender_password or sender_email == "GMAIL" or sender_password == "Password":
        print(f"[Email Notification Log] Real SENDER_EMAIL or SENDER_APP_PASSWORD not set in .env. Skipping SMTP send for {to_email}.")
        return False

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        print(f"[Email Sent Successfully] Notification email dispatched to {to_email}")
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send email to {to_email}: {e}")
        return False


def create_notification(db: Session, notification: NotificationCreate):
    db_notification = Notification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    # Trigger real email notification if customer has an email
    customer = db.query(Customer).filter(Customer.id == notification.customer_id).first()
    if customer and customer.email:
        subject = f"Nexora Billing Notification: {notification.notification_type}"
        send_real_email(customer.email, subject, notification.message)

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


def delete_notification(db: Session, notification_id: int):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.is_deleted == False
    ).first()

    if notification:
        notification.is_deleted = True
        db.commit()

    return notification


def send_subscription_notification(db: Session, subscription_id: int):
    notification = NotificationCreate(
        customer_id=1,
        notification_type="SUBSCRIPTION_RENEWED",
        message=f"Subscription {subscription_id} renewed successfully.",
        sent_date=date.today(),
        status="SENT",
        delivery_channel="EMAIL"
    )

    return create_notification(db, notification)