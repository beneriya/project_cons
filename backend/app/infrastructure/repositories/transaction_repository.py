"""Transaction repository."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Transaction, TransactionType
from app.infrastructure.database.models import TransactionModel


class TransactionRepository:
    """Repository for Transaction aggregate."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: UUID) -> Transaction | None:
        row = await self._session.get(TransactionModel, str(id))
        return self._to_entity(row) if row else None

    async def list_all(
        self,
        limit: int = 100,
        material_id: UUID | None = None,
    ) -> list[Transaction]:
        q = select(TransactionModel).order_by(TransactionModel.date.desc()).limit(limit)
        if material_id:
            q = q.where(TransactionModel.material_id == str(material_id))
        result = await self._session.execute(q)
        rows = result.scalars().all()
        return [self._to_entity(r) for r in rows]

    async def count_this_month(self) -> int:
        from sqlalchemy import func
        from datetime import date
        today = date.today()
        start_of_month = today.replace(day=1)
        q = select(func.count(TransactionModel.id)).where(
            TransactionModel.date >= datetime.combine(start_of_month, datetime.min.time())
        )
        result = await self._session.execute(q)
        return result.scalar() or 0

    async def add(self, transaction: Transaction) -> Transaction:
        model = TransactionModel(
            id=str(transaction.id),
            material_id=str(transaction.material_id),
            material_name=transaction.material_name,
            type=transaction.type.value,
            quantity=transaction.quantity,
            date=transaction.date,
            notes=transaction.notes or None,
        )
        self._session.add(model)
        await self._session.flush()
        return transaction

    @staticmethod
    def _to_entity(row: TransactionModel) -> Transaction:
        return Transaction(
            id=UUID(row.id),
            material_id=UUID(row.material_id),
            material_name=row.material_name,
            type=TransactionType(row.type),
            quantity=row.quantity,
            date=row.date,
            notes=row.notes,
        )
