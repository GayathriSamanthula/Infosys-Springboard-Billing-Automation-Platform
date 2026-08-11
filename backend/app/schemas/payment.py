from datetime import date, datetime
from typing import Optional, Union
from pydantic import BaseModel


class PaymentBase(BaseModel):
    subscription_id: int
    invoice_id: Optional[int] = None
    amount: float
    payment_method: str
    transaction_id: str
    payment_date: Union[datetime, date, str]
    payment_status: str
    gateway_name: Optional[str] = "Mock Payment Gateway"
    remarks: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    is_deleted: bool
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None
    invoice_id: Optional[int] = None
    invoice_number: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentProcessRequest(BaseModel):
    subscription_id: int
    invoice_id: Optional[int] = None
    amount: float
    payment_method: str


class PaymentProcessResponse(BaseModel):
    payment_status: str
    transaction_id: str
    response_code: Optional[str] = "200"
    response_message: str