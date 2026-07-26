from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class PaymentWebhookPayload(BaseModel):
    """
    Webhook payload sent by Mock Payment Gateway to Billing System.
    """
    invoice_id: int
    customer_id: int
    transaction_id: str
    event_type: str  # e.g., "payment.paid", "payment.failed", "payment.refunded"
    amount: float
    status: str      # e.g., "PAID", "FAILED", "REFUNDED"
    timestamp: Optional[datetime] = None


class WebhookResponse(BaseModel):
    success: bool
    message: str
    invoice_id: int
    invoice_status: str
    subscription_status: str
