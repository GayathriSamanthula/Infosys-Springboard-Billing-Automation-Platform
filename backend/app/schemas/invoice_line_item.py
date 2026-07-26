from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class InvoiceLineItemBase(BaseModel):
    description: str
    item_type: str
    quantity: int = 1
    unit_price: float
    amount: float


class InvoiceLineItemCreate(InvoiceLineItemBase):
    pass


class InvoiceLineItemResponse(InvoiceLineItemBase):
    id: int
    invoice_id: int
    created_at: datetime

    class Config:
        from_attributes = True
