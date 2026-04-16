"""Auth API schemas."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str = "buyer"
