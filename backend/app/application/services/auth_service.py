"""Auth use cases."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import User, UserRole
from app.infrastructure.auth.jwt import create_access_token, hash_password, verify_password
from app.infrastructure.repositories.user_repository import UserRepository


class AuthService:
    """Application service for authentication."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = UserRepository(session)

    async def login(self, email: str, password: str) -> tuple[User, str] | None:
        user = await self._repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        token = create_access_token(user)
        return (user, token)

    async def register(
        self,
        email: str,
        name: str,
        password: str,
        role: UserRole = UserRole.BUYER,
    ) -> tuple[User, str]:
        existing = await self._repo.get_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        user = User(
            id=uuid4(),
            email=email.lower(),
            name=name,
            hashed_password=hash_password(password),
            role=role,
        )
        await self._repo.add(user)
        token = create_access_token(user)
        return (user, token)

    async def get_user_by_id(self, user_id: str) -> User | None:
        from uuid import UUID
        return await self._repo.get_by_id(UUID(user_id))
