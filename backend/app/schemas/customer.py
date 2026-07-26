from typing import Optional
from pydantic import BaseModel, EmailStr


class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    country: str
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    customer_status: Optional[str] = "ACTIVE"


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    customer_status: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    customer_status: str
    is_deleted: bool

    class Config:
        from_attributes = True