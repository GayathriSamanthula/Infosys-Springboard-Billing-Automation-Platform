from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    working_id: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    working_id: Optional[str] = None
    admin_secret_key: Optional[str] = None

class UserLogin(BaseModel):
    email: str # Flexible string input to accept email, username, or admin ID without Pydantic 422 errors
    password: str
    working_id: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class UserResponse(UserBase):
    id: int
    working_id: Optional[str] = None

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