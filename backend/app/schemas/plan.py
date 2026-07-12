from pydantic import BaseModel


class PlanBase(BaseModel):
    name: str
    description: str
    price: float
    billing_cycle: str
    trial_period_days: int
    features: str
    status: str = "ACTIVE"
    is_archived: bool = False


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    billing_cycle: str | None = None
    trial_period_days: int | None = None
    features: str | None = None
    status: str | None = None
    is_archived: bool | None = None

class PlanResponse(PlanBase):
    id: int
    status: str
    is_deleted: bool

    class Config:
        from_attributes = True