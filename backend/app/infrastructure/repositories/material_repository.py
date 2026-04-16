"""Material repository - maps between domain and persistence."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Material, MaterialType
from app.infrastructure.database.models import MaterialModel


class MaterialRepository:
    """Repository for Material aggregate."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: UUID) -> Material | None:
        row = await self._session.get(MaterialModel, str(id))
        return self._to_entity(row) if row else None

    async def list_all(
        self,
        search: str | None = None,
        type_filter: str | None = None,
    ) -> list[Material]:
        q = select(MaterialModel).order_by(MaterialModel.name)
        if search:
            q = q.where(
                MaterialModel.name.ilike(f"%{search}%")
                | MaterialModel.type.ilike(f"%{search}%")
            )
        if type_filter and type_filter != "all":
            q = q.where(MaterialModel.type == type_filter)
        result = await self._session.execute(q)
        rows = result.scalars().all()
        return [self._to_entity(r) for r in rows]

    async def add(self, material: Material) -> Material:
        model = MaterialModel(
            id=str(material.id),
            name=material.name,
            type=material.type.value,
            m2_per_box=material.m2_per_box,
            pieces_per_box=material.pieces_per_box,
            quantity=material.quantity,
            price=material.price,
            min_threshold=material.min_threshold,
        )
        self._session.add(model)
        await self._session.flush()
        return material

    async def update(self, material: Material) -> Material:
        model = await self._session.get(MaterialModel, str(material.id))
        if model:
            model.name = material.name
            model.type = material.type.value
            model.m2_per_box = material.m2_per_box
            model.pieces_per_box = material.pieces_per_box
            model.quantity = material.quantity
            model.price = material.price
            model.min_threshold = material.min_threshold
            await self._session.flush()
        return material

    async def delete(self, id: UUID) -> bool:
        model = await self._session.get(MaterialModel, str(id))
        if model:
            await self._session.delete(model)
            await self._session.flush()
            return True
        return False

    @staticmethod
    def _to_entity(row: MaterialModel) -> Material:
        return Material(
            id=UUID(row.id),
            name=row.name,
            type=MaterialType(row.type),
            m2_per_box=row.m2_per_box,
            pieces_per_box=row.pieces_per_box,
            quantity=row.quantity,
            price=row.price,
            min_threshold=row.min_threshold,
        )
