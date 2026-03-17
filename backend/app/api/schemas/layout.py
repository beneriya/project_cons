"""Layout planner API schemas."""

from pydantic import BaseModel, Field


class LayoutCalculateRequest(BaseModel):
    width_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)
    material_id: str
    waste_percentage: float = Field(10, ge=0, le=50)


class LayoutCalculateResponse(BaseModel):
    total_area_m2: float
    area_with_waste_m2: float
    tiles_needed: int
    boxes_needed: int
    total_cost: float
    insufficient_stock: bool
    available_boxes: int
