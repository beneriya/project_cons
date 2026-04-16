"""Layout planner use cases."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.services.layout_calculator import LayoutCalculator, LayoutCalculationResult
from app.domain.services.knapsack_optimizer import (
    KnapsackOptimizer,
    MaterialOption,
    OptimizationResult,
)
from app.infrastructure.repositories.material_repository import MaterialRepository


class LayoutService:
    """Application service for layout calculations."""

    def __init__(self, session: AsyncSession) -> None:
        self._material_repo = MaterialRepository(session)

    async def calculate(
        self,
        width_m: float,
        height_m: float,
        material_id: UUID,
        waste_percentage: float = 10.0,
    ) -> LayoutCalculationResult:
        material = await self._material_repo.get_by_id(material_id)
        if not material:
            raise ValueError("Material not found")

        return LayoutCalculator.calculate(
            width_m=width_m,
            height_m=height_m,
            m2_per_box=material.m2_per_box,
            pieces_per_box=material.pieces_per_box,
            price_per_box=material.price,
            waste_percentage=waste_percentage,
            available_boxes=material.quantity,
        )

    async def optimize(
        self,
        width_m: float,
        height_m: float,
        waste_percentage: float = 10.0,
    ) -> OptimizationResult:
        """Run knapsack optimizer across all available materials."""
        all_materials = await self._material_repo.list_all()
        if not all_materials:
            raise ValueError("No materials in inventory")

        options = [
            MaterialOption(
                id=str(m.id),
                name=m.name,
                m2_per_box=m.m2_per_box,
                price_per_box=m.price,
                available_boxes=m.quantity,
            )
            for m in all_materials
            if m.quantity > 0
        ]

        if not options:
            raise ValueError("All materials are out of stock")

        required_area = width_m * height_m
        return KnapsackOptimizer.optimize(
            required_area_m2=required_area,
            waste_percentage=waste_percentage,
            materials=options,
        )
