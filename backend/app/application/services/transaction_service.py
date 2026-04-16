"""Transaction use cases."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Material, Transaction, TransactionType
from app.infrastructure.repositories.material_repository import MaterialRepository
from app.infrastructure.repositories.transaction_repository import TransactionRepository


class TransactionService:
    """Application service for transaction operations."""

    def __init__(self, session: AsyncSession) -> None:
        self._tx_repo = TransactionRepository(session)
        self._material_repo = MaterialRepository(session)

    async def list_transactions(
        self,
        limit: int = 100,
        material_id: UUID | None = None,
    ) -> list[Transaction]:
        return await self._tx_repo.list_all(limit=limit, material_id=material_id)

    async def add_transaction(
        self,
        material_id: UUID,
        type: TransactionType,
        quantity: int,
        notes: str | None = None,
    ) -> Transaction:
        material = await self._material_repo.get_by_id(material_id)
        if not material:
            raise ValueError("Material not found")

        if type == TransactionType.OUT and not material.can_fulfill_boxes(quantity):
            raise ValueError(
                f"Insufficient stock: have {material.quantity} boxes, need {quantity}"
            )

        delta = quantity if type == TransactionType.IN else -quantity
        material.update_quantity(delta)

        transaction = Transaction(
            id=uuid4(),
            material_id=material_id,
            material_name=material.name,
            type=type,
            quantity=quantity,
            date=datetime.utcnow(),
            notes=notes,
        )

        await self._tx_repo.add(transaction)
        await self._material_repo.update(material)
        return transaction

    async def count_this_month(self) -> int:
        return await self._tx_repo.count_this_month()
