"""Material use cases."""

from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Material, MaterialType
from app.infrastructure.repositories.material_repository import MaterialRepository


class MaterialService:
    """Application service for material operations."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = MaterialRepository(session)

    async def list_materials(
        self,
        search: str | None = None,
        type_filter: str | None = None,
    ) -> list[Material]:
        return await self._repo.list_all(search=search, type_filter=type_filter)

    async def get_material(self, id: UUID) -> Material | None:
        return await self._repo.get_by_id(id)

    async def create_material(
        self,
        name: str,
        type: str,
        m2_per_box: float,
        pieces_per_box: int,
        quantity: int,
        price: float,
        min_threshold: int,
    ) -> Material:
        material = Material(
            id=uuid4(),
            name=name,
            type=MaterialType(type),
            m2_per_box=m2_per_box,
            pieces_per_box=pieces_per_box,
            quantity=quantity,
            price=price,
            min_threshold=min_threshold,
        )
        return await self._repo.add(material)

    async def update_material(
        self,
        id: UUID,
        *,
        name: str | None = None,
        type: str | None = None,
        m2_per_box: float | None = None,
        pieces_per_box: int | None = None,
        quantity: int | None = None,
        price: float | None = None,
        min_threshold: int | None = None,
    ) -> Material | None:
        existing = await self._repo.get_by_id(id)
        if not existing:
            return None
        # Apply updates
        if name is not None:
            existing._name = name
        if type is not None:
            existing._type = MaterialType(type)
        if m2_per_box is not None:
            existing._m2_per_box = m2_per_box
        if pieces_per_box is not None:
            existing._pieces_per_box = pieces_per_box
        if quantity is not None:
            if quantity < 0:
                raise ValueError("Quantity cannot be negative")
            existing._quantity = quantity
        if price is not None:
            existing._price = price
        if min_threshold is not None:
            existing._min_threshold = min_threshold
        await self._repo.update(existing)
        return existing

    async def delete_material(self, id: UUID) -> bool:
        return await self._repo.delete(id)
