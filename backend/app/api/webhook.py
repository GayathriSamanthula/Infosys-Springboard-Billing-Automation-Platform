from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.webhook import PaymentWebhookPayload, WebhookResponse
from app.services.webhook_service import process_payment_webhook

router = APIRouter(
    prefix="/payments/webhook",
    tags=["Payment Webhooks"]
)


@router.post("", response_model=WebhookResponse)
def handle_payment_webhook(
    payload: PaymentWebhookPayload,
    db: Session = Depends(get_db)
):
    """
    Receives incoming webhook events from Payment Gateway (paid, failed, refunded).
    Updates invoice status, subscription state machine, and audit logs.
    """
    try:
        response = process_payment_webhook(db, payload)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing webhook: {str(e)}"
        )
