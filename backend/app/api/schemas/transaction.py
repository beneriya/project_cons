"""Transaction API schemas."""

from uuid import UUID

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    material_id: str
    type: str = Field(..., pattern="^(IN|OUT)$")
    quantity: int = Field(..., gt=0)
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: str
    material_id: str
    material_name: str
    type: str
    quantity: int
    date: str
    notes: str | None = None
