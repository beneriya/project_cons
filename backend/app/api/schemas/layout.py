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


# --- Optimization schemas ---

class OptimizeRequest(BaseModel):
    width_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)
    waste_percentage: float = Field(10, ge=0, le=50)
    selected_material_id: str | None = None  # for naive comparison baseline


class AllocationItemResponse(BaseModel):
    material_id: str
    material_name: str
    boxes: int
    m2_covered: float
    cost: float
    price_per_box: float
    m2_per_box: float


class OptimizeResponse(BaseModel):
    # Room info
    required_area_m2: float
    waste_percentage: float
    area_with_waste_m2: float

    # Naive: single cheapest material
    naive_material_id: str
    naive_material_name: str
    naive_boxes: int
    naive_cost: float
    naive_m2_covered: float

    # Optimized: knapsack DP
    optimized_allocations: list[AllocationItemResponse]
    optimized_total_cost: float
    optimized_total_m2: float
    optimized_total_boxes: int

    # Comparison
    cost_savings: float
    savings_percentage: float
