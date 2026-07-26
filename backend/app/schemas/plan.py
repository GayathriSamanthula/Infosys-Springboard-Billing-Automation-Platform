from pydantic import BaseModel, field_validator
from typing import Optional, Union, List, Any


class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    billing_cycle: str  # MONTHLY / YEARLY / ANNUAL
    trial_period_days: Optional[int] = 0
    features: Optional[Union[str, List[str], Any]] = None
    status: Optional[str] = "ACTIVE"
    is_archived: Optional[bool] = False

    @field_validator('billing_cycle')

    @classmethod
    def validate_billing_cycle(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Billing cycle interval is required.")
        normalized = v.strip().upper()
        if normalized not in ["MONTHLY", "YEARLY", "ANNUAL"]:
            raise ValueError("Invalid billing cycle interval. Supported values are: MONTHLY, YEARLY")
        return normalized

    @field_validator('features')

    @classmethod
    def validate_features(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, list):
            return ", ".join([str(item) for item in v])
        return str(v)


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    billing_cycle: Optional[str] = None
    trial_period_days: Optional[int] = None
    features: Optional[Union[str, List[str], Any]] = None
    status: Optional[str] = None
    is_archived: Optional[bool] = None

    @field_validator('billing_cycle')

    @classmethod
    def validate_billing_cycle(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        normalized = v.strip().upper()
        if normalized not in ["MONTHLY", "YEARLY", "ANNUAL"]:
            raise ValueError("Invalid billing cycle interval. Supported values are: MONTHLY, YEARLY")
        return normalized

    @field_validator('features')

    @classmethod
    def validate_features(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, list):
            return ", ".join([str(item) for item in v])
        return str(v)


class PlanResponse(PlanBase):
    id: int
    status: str
    is_deleted: bool

    class Config:
        from_attributes = True