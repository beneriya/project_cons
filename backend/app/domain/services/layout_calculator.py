"""Layout calculator domain service - parquet floor material calculation."""

import math
from dataclasses import dataclass


@dataclass
class LayoutCalculationResult:
    """Result of layout material calculation."""

    total_area_m2: float
    area_with_waste_m2: float
    tiles_needed: int
    boxes_needed: int
    total_cost: float
    insufficient_stock: bool
    available_boxes: int


class LayoutCalculator:
    """Domain service: calculates required parquet materials for a room."""

    @staticmethod
    def calculate(
        width_m: float,
        height_m: float,
        m2_per_box: float,
        pieces_per_box: int,
        price_per_box: float,
        waste_percentage: float,
        available_boxes: int,
    ) -> LayoutCalculationResult:
        """
        Calculate materials needed for room layout.

        Args:
            width_m: Room width in meters
            height_m: Room height in meters
            m2_per_box: Square meters covered per box
            pieces_per_box: Pieces per box
            price_per_box: Price in currency
            waste_percentage: Waste factor 0-50 (%)
            available_boxes: Current stock
        """
        if width_m <= 0 or height_m <= 0:
            raise ValueError("Room dimensions must be positive")
        if m2_per_box <= 0 or pieces_per_box <= 0:
            raise ValueError("Invalid material specs")

        total_area = width_m * height_m
        waste_multiplier = 1 + (waste_percentage / 100)
        area_with_waste = total_area * waste_multiplier
        boxes_needed = math.ceil(area_with_waste / m2_per_box)
        tiles_needed = boxes_needed * pieces_per_box
        total_cost = boxes_needed * price_per_box
        insufficient = boxes_needed > available_boxes

        return LayoutCalculationResult(
            total_area_m2=total_area,
            area_with_waste_m2=area_with_waste,
            tiles_needed=tiles_needed,
            boxes_needed=boxes_needed,
            total_cost=total_cost,
            insufficient_stock=insufficient,
            available_boxes=available_boxes,
        )
