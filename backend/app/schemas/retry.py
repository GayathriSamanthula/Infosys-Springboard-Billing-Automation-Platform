from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RetryConfigBase(BaseModel):
    retry_attempt: int
    retry_after_days: int
    is_active: bool = True


class RetryConfigCreate(RetryConfigBase):
    pass


class RetryConfigResponse(RetryConfigBase):
    id: int

    class Config:
        from_attributes = True


class RetryQueueBase(BaseModel):
    invoice_id: int
    customer_id: int
    retry_attempt: int = 1
    scheduled_retry_date: datetime
    actual_retry_date: Optional[datetime] = None
    retry_status: str = "PENDING"
    failure_reason: Optional[str] = None
    next_retry_date: Optional[datetime] = None


class RetryQueueCreate(RetryQueueBase):
    payment_id: Optional[int] = None


class RetryQueueResponse(RetryQueueBase):
    retry_id: int
    payment_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RetryProcessResponse(BaseModel):
    processed_count: int
    success_count: int
    failed_count: int
    details: List[dict]
