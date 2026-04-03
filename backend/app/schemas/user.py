from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    """Common user fields."""
    email: EmailStr
    full_name: Optional[str] = None
    company_id: Optional[str] = "Megascript Digital"
    role: Optional[str] = "OPERATOR"
    latitude: Optional[str] = "-1.2921"
    longitude: Optional[str] = "36.7884"

class UserCreate(UserBase):
    """Schema for user registration."""
    password: str

class UserResponse(UserBase):
    """Schema for public user profile."""
    id: str
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for JWT access tokens."""
    access_token: str
    token_type: str
