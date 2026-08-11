from datetime import date, datetime
from typing import Optional, Any
from pydantic import BaseModel

from app.models.subscription import SubscriptionStatus


class SubscriptionBase(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    next_billing_date: Optional[date] = None
    status: Any = SubscriptionStatus.ACTIVE
    auto_renew: Optional[bool] = True


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    auto_renew: bool = True
    status: Optional[SubscriptionStatus] = None
    platform_source: Optional[str] = "NEXORA_DIRECT"


class SubscriptionUpdate(BaseModel):
    customer_id: Optional[int] = None
    plan_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    next_billing_date: Optional[date] = None
    status: Optional[SubscriptionStatus] = None
    auto_renew: Optional[bool] = None
    platform_source: Optional[str] = None


class SubscriptionResponse(SubscriptionBase):
    id: int
    is_deleted: bool
    cancel_at_period_end: bool
    platform_source: str = "NEXORA_DIRECT"

    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None

    trial_started_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None
    past_due_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    pause_date: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True