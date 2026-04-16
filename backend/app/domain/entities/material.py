"""Material domain entity and value objects."""

from enum import Enum
from uuid import UUID


class MaterialType(str, Enum):
    """Parquet material type."""

    LAMINATE = "Laminate"
    SOLID_WOOD = "Solid Wood"
    ENGINEERED = "Engineered"
    SPC = "SPC"
    WPC = "WPC"


class StockStatus(str, Enum):
    """Material stock status derived from quantity vs threshold."""

    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"


class Material:
    """Material aggregate root - parquet flooring inventory item."""

    def __init__(
        self,
        id: UUID,
        name: str,
        type: MaterialType,
        m2_per_box: float,
        pieces_per_box: int,
        quantity: int,
        price: float,
        min_threshold: int,
    ) -> None:
        if quantity < 0:
            raise ValueError("Quantity cannot be negative")
        if min_threshold < 0:
            raise ValueError("Min threshold cannot be negative")
        if m2_per_box <= 0 or pieces_per_box <= 0 or price < 0:
            raise ValueError("Invalid material specifications")

        self._id = id
        self._name = name
        self._type = type
        self._m2_per_box = m2_per_box
        self._pieces_per_box = pieces_per_box
        self._quantity = quantity
        self._price = price
        self._min_threshold = min_threshold

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def type(self) -> MaterialType:
        return self._type

    @property
    def m2_per_box(self) -> float:
        return self._m2_per_box

    @property
    def pieces_per_box(self) -> int:
        return self._pieces_per_box

    @property
    def quantity(self) -> int:
        return self._quantity

    @property
    def price(self) -> float:
        return self._price

    @property
    def min_threshold(self) -> int:
        return self._min_threshold

    def stock_status(self) -> StockStatus:
        """Domain logic: derive stock status from quantity and threshold."""
        if self._quantity == 0:
            return StockStatus.OUT_OF_STOCK
        if self._quantity <= self._min_threshold:
            return StockStatus.LOW_STOCK
        return StockStatus.IN_STOCK

    def can_fulfill_boxes(self, boxes: int) -> bool:
        """Domain logic: check if we have enough stock for given boxes."""
        return self._quantity >= boxes

    def update_quantity(self, delta: int) -> None:
        """Update quantity (positive for IN, negative for OUT). Validates before update."""
        new_qty = self._quantity + delta
        if new_qty < 0:
            raise ValueError(f"Insufficient stock: have {self._quantity}, need {-delta}")
        self._quantity = new_qty
