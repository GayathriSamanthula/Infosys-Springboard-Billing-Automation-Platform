from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)
from app.services.notification_service import (
    create_notification,
    get_notifications,
    get_notification,
    delete_notification,
    mark_notification_as_read,
)

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/", response_model=list[NotificationResponse])
def read_notifications(db: Session = Depends(get_db)):
    return get_notifications(db)


@router.post("/", response_model=NotificationResponse)
def create_new_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    return create_notification(db, notification)


@router.get("/{notification_id}", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = get_notification(db, notification_id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


from pydantic import BaseModel
from app.services.notification_service import (
    create_notification,
    get_notifications,
    get_notification,
    delete_notification,
    send_smart_email
)


class TestEmailRequest(BaseModel):
    recipient_email: str = "arjun.kumar@example.com"
    customer_name: str = "Arjun Kumar"
    platform: str = "NEXORA"  # "NEXORA" or "VELORA"
    template_name: str = "nexora_payment_success.html"  # "nexora_payment_success.html", "velora_payment_success.html", etc.


class PromotionalEmailRequest(BaseModel):
    recipient_email: str = "arjun.kumar@example.com"
    customer_name: str = "Arjun Kumar"
    offer_title: str = "Special 20% Off Annual Upgrade"
    offer_message: str = "Upgrade to our Premium Plus annual plan today and get 2 months free with instant priority billing automation."
    promo_code: str = "NEXORA2026"
    valid_until: str = "August 31, 2026"
    platform: str = "NEXORA"


@router.post("/send-test-email", summary="Trigger Test Email Notification (Smart Hybrid Route)")
def trigger_test_email(req: TestEmailRequest):
    """Triggers an automated HTML email notification test across Nexora or Velora."""
    success = send_smart_email(
        to_email=req.recipient_email,
        customer_name=req.customer_name,
        subject=f"[{req.platform}] Interactive Email Notification Test",
        template_name=req.template_name,
        context={
            "invoice_number": "INV-TEST-2026",
            "transaction_id": "tx_test_9941",
            "payment_date": "2026-07-31",
            "payment_method": "Credit Card",
            "plan_name": "Premium Plan",
            "amount": "999.00",
            "platform_title": "Nexora Billing Platform" if req.platform.upper() == "NEXORA" else "Velora Fintech Platform",
            "portal_url": "http://localhost/customer/login" if req.platform.upper() == "NEXORA" else "http://localhost/velora/customer/login"
        },
        platform=req.platform
    )
    return {
        "status": "SUCCESS" if success else "SIMULATED_LOGGED",
        "intended_recipient": req.recipient_email,
        "platform": req.platform,
        "template": req.template_name
    }


@router.post("/send-promotional", summary="Broadcast Promotional Offer Email")
def trigger_promotional_email(req: PromotionalEmailRequest):
    """Sends a formatted promotional offer or discount announcement email to a customer."""
    platform_name = "Nexora Billing Platform" if req.platform.upper() == "NEXORA" else "Velora Fintech Platform"
    cta = "http://localhost/customer/login" if req.platform.upper() == "NEXORA" else "http://localhost/velora"
    
    success = send_smart_email(
        to_email=req.recipient_email,
        customer_name=req.customer_name,
        subject=f"🎁 Exclusive Offer: {req.offer_title}",
        template_name="promotional_offer.html",
        context={
            "offer_title": req.offer_title,
            "offer_message": req.offer_message,
            "promo_code": req.promo_code,
            "valid_until": req.valid_until,
            "platform_title": platform_name,
            "cta_link": cta
        },
        platform=req.platform
    )
    return {
        "status": "SUCCESS" if success else "SIMULATED_LOGGED",
        "recipient": req.recipient_email,
        "offer_title": req.offer_title,
        "promo_code": req.promo_code
    }


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
@router.put("/{notification_id}/read", response_model=NotificationResponse)
@router.patch("/{notification_id}", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = mark_notification_as_read(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.delete("/{notification_id}")
def remove_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = delete_notification(db, notification_id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification deleted successfully"}