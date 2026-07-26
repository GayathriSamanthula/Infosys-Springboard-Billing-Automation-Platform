from datetime import date

from pydantic import BaseModel


from typing import Optional


class BillingCycleBase(BaseModel):
    subscription_id: int
    billing_start_date: date
    billing_end_date: date
    renewal_date: date
    next_billing_date: date
    cycle_status: str


class BillingCycleCreate(BillingCycleBase):
    pass


class BillingCycleResponse(BillingCycleBase):
    id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None

    class Config:
        from_attributes = True