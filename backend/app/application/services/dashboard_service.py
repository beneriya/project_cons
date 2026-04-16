"""Dashboard use cases - aggregate stats."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Material
from app.infrastructure.repositories.material_repository import MaterialRepository
from app.infrastructure.repositories.transaction_repository import TransactionRepository


class DashboardService:
    """Application service for dashboard statistics."""

    def __init__(self, session: AsyncSession) -> None:
        self._material_repo = MaterialRepository(session)
        self._tx_repo = TransactionRepository(session)

    async def get_stats(self) -> dict:
        materials = await self._material_repo.list_all()
        transactions_count = await self._tx_repo.count_this_month()

        total_materials = len(materials)
        in_stock = sum(1 for m in materials if m.stock_status().value == "in_stock")
        low_stock = sum(1 for m in materials if m.stock_status().value == "low_stock")

        low_stock_items = [
            {
                "id": str(m.id),
                "name": m.name,
                "type": m.type.value,
                "quantity": m.quantity,
                "min_threshold": m.min_threshold,
            }
            for m in materials
            if m.stock_status().value == "low_stock"
        ]

        recent_txs = await self._tx_repo.list_all(limit=5)
        recent_transactions = [
            {
                "id": str(t.id),
                "material_id": str(t.material_id),
                "material_name": t.material_name,
                "type": t.type.value,
                "quantity": t.quantity,
                "date": t.date.isoformat(),
            }
            for t in recent_txs
        ]

        return {
            "total_materials": total_materials,
            "in_stock": in_stock,
            "low_stock": low_stock,
            "transactions_this_month": transactions_count,
            "low_stock_items": low_stock_items,
            "recent_transactions": recent_transactions,
        }
