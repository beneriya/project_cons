"""Material API schemas."""

from uuid import UUID

from pydantic import BaseModel, Field


class MaterialCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(Laminate|Solid Wood|Engineered|SPC|WPC)$")
    m2_per_box: float = Field(..., gt=0)
    pieces_per_box: int = Field(..., gt=0)
    quantity: int = Field(..., ge=0)
    price: float = Field(..., ge=0)
    min_threshold: int = Field(..., ge=0)


class MaterialUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    type: str | None = Field(None, pattern="^(Laminate|Solid Wood|Engineered|SPC|WPC)$")
    m2_per_box: float | None = Field(None, gt=0)
    pieces_per_box: int | None = Field(None, gt=0)
    quantity: int | None = Field(None, ge=0)
    price: float | None = Field(None, ge=0)
    min_threshold: int | None = Field(None, ge=0)


class MaterialResponse(BaseModel):
    id: str
    name: str
    type: str
    m2_per_box: float
    pieces_per_box: int
    quantity: int
    price: float
    min_threshold: int
    status: str

    class Config:
        from_attributes = False
