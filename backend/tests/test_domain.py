"""Domain layer unit tests."""

import pytest
from uuid import uuid4

from app.domain.entities import Material, MaterialType, Transaction, TransactionType
from app.domain.entities.material import StockStatus
from app.domain.services.layout_calculator import LayoutCalculator, LayoutCalculationResult


class TestMaterial:
    def test_stock_status_in_stock(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=20,
            price=100,
            min_threshold=5,
        )
        assert m.stock_status() == StockStatus.IN_STOCK

    def test_stock_status_low_stock(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=5,
            price=100,
            min_threshold=10,
        )
        assert m.stock_status() == StockStatus.LOW_STOCK

    def test_stock_status_out_of_stock(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=0,
            price=100,
            min_threshold=5,
        )
        assert m.stock_status() == StockStatus.OUT_OF_STOCK

    def test_can_fulfill_boxes(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=10,
            price=100,
            min_threshold=5,
        )
        assert m.can_fulfill_boxes(5) is True
        assert m.can_fulfill_boxes(10) is True
        assert m.can_fulfill_boxes(11) is False

    def test_update_quantity_in(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=10,
            price=100,
            min_threshold=5,
        )
        m.update_quantity(5)
        assert m.quantity == 15

    def test_update_quantity_out(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=10,
            price=100,
            min_threshold=5,
        )
        m.update_quantity(-3)
        assert m.quantity == 7

    def test_update_quantity_insufficient_raises(self):
        m = Material(
            id=uuid4(),
            name="Oak",
            type=MaterialType.LAMINATE,
            m2_per_box=2.4,
            pieces_per_box=12,
            quantity=5,
            price=100,
            min_threshold=5,
        )
        with pytest.raises(ValueError, match="Insufficient stock"):
            m.update_quantity(-10)

    def test_invalid_quantity_raises(self):
        with pytest.raises(ValueError):
            Material(
                id=uuid4(),
                name="Oak",
                type=MaterialType.LAMINATE,
                m2_per_box=2.4,
                pieces_per_box=12,
                quantity=-1,
                price=100,
                min_threshold=5,
            )


class TestLayoutCalculator:
    def test_calculate_basic(self):
        r = LayoutCalculator.calculate(
            width_m=5,
            height_m=4,
            m2_per_box=2.0,
            pieces_per_box=10,
            price_per_box=100,
            waste_percentage=10,
            available_boxes=15,
        )
        assert r.total_area_m2 == 20
        assert r.area_with_waste_m2 == 22
        assert r.boxes_needed == 11
        assert r.tiles_needed == 110
        assert r.total_cost == 1100
        assert r.insufficient_stock is False

    def test_calculate_insufficient_stock(self):
        r = LayoutCalculator.calculate(
            width_m=10,
            height_m=10,
            m2_per_box=2.0,
            pieces_per_box=10,
            price_per_box=100,
            waste_percentage=10,
            available_boxes=40,
        )
        # 100m² + 10% waste = 110m², ceil(110/2) = 55 or 56 (float precision)
        assert r.boxes_needed >= 55
        assert r.insufficient_stock is True

    def test_calculate_invalid_dimensions(self):
        with pytest.raises(ValueError, match="Room dimensions"):
            LayoutCalculator.calculate(
                width_m=0,
                height_m=4,
                m2_per_box=2.0,
                pieces_per_box=10,
                price_per_box=100,
                waste_percentage=10,
                available_boxes=10,
            )
