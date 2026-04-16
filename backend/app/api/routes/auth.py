"""Auth routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.api.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.application.services.auth_service import AuthService
from app.domain.entities import UserRole

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    auth_svc = AuthService(session)
    result = await auth_svc.login(body.email, body.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    user, token = result
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role.value,
        ),
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    auth_svc = AuthService(session)
    try:
        user, token = await auth_svc.register(
            email=body.email,
            name=body.name,
            password=body.password,
            role=UserRole.BUYER,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role.value,
        ),
    )
