from datetime import datetime
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    event: str
    performed_by: str
    description: str


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True