from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.invoice_line_item import InvoiceLineItemResponse


class InvoiceBase(BaseModel):
    subscription_id: int
    invoice_number: str
    amount: float
    tax_amount: float = 0.0
    refund_amount: float = 0.0
    billing_direction: str = "CUSTOMER_PAYS"
    issue_date: date
    due_date: date
    status: str
    remarks: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceResponse(InvoiceBase):
    id: int
    payment_date: Optional[date] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None
    line_items: List[InvoiceLineItemResponse] = []

    class Config:
        from_attributes = True