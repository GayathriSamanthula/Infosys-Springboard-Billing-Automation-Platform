from datetime import date
from pydantic import BaseModel


class PaymentBase(BaseModel):
    subscription_id: int
    amount: float
    payment_method: str
    transaction_id: str
    payment_date: date
    payment_status: str
    gateway_name: str
    remarks: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    is_deleted: bool

    class Config:
        from_attributes = True