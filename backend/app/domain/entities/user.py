"""User domain entity."""

from enum import Enum
from uuid import UUID


class UserRole(str, Enum):
    """User role for authorization."""

    ADMIN = "admin"
    WORKER = "worker"
    BUYER = "buyer"


class User:
    """User aggregate root."""

    def __init__(
        self,
        id: UUID,
        email: str,
        name: str,
        hashed_password: str,
        role: UserRole = UserRole.BUYER,
    ) -> None:
        self._id = id
        self._email = email
        self._name = name
        self._hashed_password = hashed_password
        self._role = role

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def email(self) -> str:
        return self._email

    @property
    def name(self) -> str:
        return self._name

    @property
    def hashed_password(self) -> str:
        return self._hashed_password

    @property
    def role(self) -> UserRole:
        return self._role
