from datetime import date
from typing import Optional
from pydantic import BaseModel


class PaymentBase(BaseModel):
    subscription_id: int
    amount: float
    payment_method: str
    transaction_id: str
    payment_date: date
    payment_status: str
    gateway_name: Optional[str] = "Mock Payment Gateway"
    remarks: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    is_deleted: bool
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentProcessRequest(BaseModel):
    subscription_id: int
    amount: float
    payment_method: str


class PaymentProcessResponse(BaseModel):
    payment_status: str
    transaction_id: str
    response_code: str
    response_message: str