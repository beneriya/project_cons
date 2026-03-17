"""User repository."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import User, UserRole
from app.infrastructure.database.models import UserModel


class UserRepository:
    """Repository for User aggregate."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: UUID) -> User | None:
        row = await self._session.get(UserModel, str(id))
        return self._to_entity(row) if row else None

    async def get_by_email(self, email: str) -> User | None:
        q = select(UserModel).where(UserModel.email == email.lower())
        result = await self._session.execute(q)
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, user: User) -> User:
        model = UserModel(
            id=str(user.id),
            email=user.email,
            name=user.name,
            hashed_password=user.hashed_password,
            role=user.role.value,
        )
        self._session.add(model)
        await self._session.flush()
        return user

    @staticmethod
    def _to_entity(row: UserModel) -> User:
        return User(
            id=UUID(row.id),
            email=row.email,
            name=row.name,
            hashed_password=row.hashed_password,
            role=UserRole(row.role),
        )
