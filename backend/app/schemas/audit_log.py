from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    event: str
    performed_by: str
    user_id: Optional[int] = None
    customer_id: Optional[int] = None
    description: str


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True