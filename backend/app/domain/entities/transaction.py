"""Transaction domain entity."""

from datetime import datetime
from enum import Enum
from uuid import UUID


class TransactionType(str, Enum):
    """Stock movement type."""

    IN = "IN"
    OUT = "OUT"


class Transaction:
    """Transaction aggregate - stock movement record."""

    def __init__(
        self,
        id: UUID,
        material_id: UUID,
        material_name: str,
        type: TransactionType,
        quantity: int,
        date: datetime,
        notes: str | None = None,
    ) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be positive")

        self._id = id
        self._material_id = material_id
        self._material_name = material_name
        self._type = type
        self._quantity = quantity
        self._date = date
        self._notes = notes or ""

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def material_id(self) -> UUID:
        return self._material_id

    @property
    def material_name(self) -> str:
        return self._material_name

    @property
    def type(self) -> TransactionType:
        return self._type

    @property
    def quantity(self) -> int:
        return self._quantity

    @property
    def date(self) -> datetime:
        return self._date

    @property
    def notes(self) -> str:
        return self._notes
