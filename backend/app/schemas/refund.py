from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RefundCreate(BaseModel):
    invoice_id: int
    amount: Optional[float] = None
    reason: Optional[str] = "Customer requested refund"


class RefundRequest(RefundCreate):
    pass


class RefundResponse(BaseModel):
    id: int
    invoice_id: int
    customer_id: int
    amount: float
    reason: Optional[str]
    status: str
    created_at: datetime
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None

    class Config:
        from_attributes = True
