from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: Optional[int] = None
    role: Optional[str] = "ADMIN"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None