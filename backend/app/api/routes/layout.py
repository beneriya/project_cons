"""Layout planner routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.api.schemas.layout import (
    LayoutCalculateRequest,
    LayoutCalculateResponse,
    OptimizeRequest,
    OptimizeResponse,
    AllocationItemResponse,
)
from app.application.services.layout_service import LayoutService
from app.domain.entities import User

router = APIRouter(prefix="/layout", tags=["layout"])


@router.post("/calculate", response_model=LayoutCalculateResponse)
async def calculate_layout(
    body: LayoutCalculateRequest,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> LayoutCalculateResponse:
    svc = LayoutService(session)
    try:
        result = await svc.calculate(
            width_m=body.width_m,
            height_m=body.height_m,
            material_id=UUID(body.material_id),
            waste_percentage=body.waste_percentage,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return LayoutCalculateResponse(
        total_area_m2=result.total_area_m2,
        area_with_waste_m2=result.area_with_waste_m2,
        tiles_needed=result.tiles_needed,
        boxes_needed=result.boxes_needed,
        total_cost=result.total_cost,
        insufficient_stock=result.insufficient_stock,
        available_boxes=result.available_boxes,
    )


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_layout(
    body: OptimizeRequest,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> OptimizeResponse:
    """Compare naive single-material vs knapsack-optimized material selection."""
    svc = LayoutService(session)
    try:
        result = await svc.optimize(
            width_m=body.width_m,
            height_m=body.height_m,
            waste_percentage=body.waste_percentage,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return OptimizeResponse(
        required_area_m2=result.required_area_m2,
        waste_percentage=result.waste_percentage,
        area_with_waste_m2=result.area_with_waste_m2,
        naive_material_id=result.naive_material_id,
        naive_material_name=result.naive_material_name,
        naive_boxes=result.naive_boxes,
        naive_cost=result.naive_cost,
        naive_m2_covered=result.naive_m2_covered,
        optimized_allocations=[
            AllocationItemResponse(
                material_id=a.material_id,
                material_name=a.material_name,
                boxes=a.boxes,
                m2_covered=a.m2_covered,
                cost=a.cost,
                price_per_box=a.price_per_box,
                m2_per_box=a.m2_per_box,
            )
            for a in result.optimized_allocations
        ],
        optimized_total_cost=result.optimized_total_cost,
        optimized_total_m2=result.optimized_total_m2,
        optimized_total_boxes=result.optimized_total_boxes,
        cost_savings=result.cost_savings,
        savings_percentage=result.savings_percentage,
    )
