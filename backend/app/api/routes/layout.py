"""Layout planner routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.api.schemas.layout import (
    LayoutCalculateRequest,
    LayoutCalculateResponse,
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
