from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    event: str
    performed_by: str
    user_id: Optional[int] = None
    customer_id: Optional[int] = None
    subscription_id: Optional[int] = None
    invoice_id: Optional[int] = None
    payment_id: Optional[int] = None
    refund_id: Optional[int] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user_role: Optional[str] = "ADMIN"
    ip_address: Optional[str] = "127.0.0.1"
    remarks: Optional[str] = None
    description: str


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True