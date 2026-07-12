from datetime import date, datetime

from pydantic import BaseModel

from backend.app.models.subscription import SubscriptionStatus



class SubscriptionBase(BaseModel):
    customer_id: int
    plan_id: int
    start_date: date
    end_date: date
    next_billing_date: date
    status: SubscriptionStatus
    auto_renew: bool


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    auto_renew: bool = True
    

class SubscriptionUpdate(BaseModel):
    customer_id: int | None = None
    plan_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    next_billing_date: date | None = None
    status: SubscriptionStatus | None = None
    auto_renew: bool | None = None


class SubscriptionResponse(SubscriptionBase):
    id: int
    is_deleted: bool
    cancel_at_period_end: bool

    trial_started_at: datetime | None = None
    activated_at: datetime | None = None
    past_due_at: datetime | None = None
    cancelled_at: datetime | None = None
    pause_date: datetime | None = None
    class Config:
        from_attributes = True