from typing import Optional
from pydantic import BaseModel, EmailStr


class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    country: Optional[str] = "India"
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    customer_status: Optional[str] = "ACTIVE"
    platform_source: Optional[str] = "NEXORA_DIRECT"


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    customer_status: Optional[str] = None
    platform_source: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    customer_status: str
    platform_source: str = "NEXORA_DIRECT"
    is_deleted: bool

    class Config:
        from_attributes = True


class CustomerLogin(BaseModel):
    email: str
    password: str


class CustomerTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer_id: int
    full_name: str
    email: str
    role: str = "CUSTOMER"
    platform_source: str = "NEXORA_DIRECT"


class CustomerRegister(BaseModel):
    username: str
    password: str
    email: EmailStr
    phone_number: str
    country: Optional[str] = None
    address: Optional[str] = None
    platform_source: Optional[str] = "NEXORA_DIRECT"


class CustomerVerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str