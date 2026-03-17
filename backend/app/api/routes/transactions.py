"""Transaction routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.api.schemas.transaction import TransactionCreate, TransactionResponse
from app.application.services.transaction_service import TransactionService
from app.domain.entities import TransactionType, User

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = 100,
    material_id: str | None = None,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[TransactionResponse]:
    svc = TransactionService(session)
    mid = UUID(material_id) if material_id else None
    transactions = await svc.list_transactions(limit=limit, material_id=mid)
    return [
        TransactionResponse(
            id=str(t.id),
            material_id=str(t.material_id),
            material_name=t.material_name,
            type=t.type.value,
            quantity=t.quantity,
            date=t.date.isoformat(),
            notes=t.notes or None,
        )
        for t in transactions
    ]


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    body: TransactionCreate,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> TransactionResponse:
    svc = TransactionService(session)
    try:
        tx = await svc.add_transaction(
            material_id=UUID(body.material_id),
            type=TransactionType(body.type),
            quantity=body.quantity,
            notes=body.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return TransactionResponse(
        id=str(tx.id),
        material_id=str(tx.material_id),
        material_name=tx.material_name,
        type=tx.type.value,
        quantity=tx.quantity,
        date=tx.date.isoformat(),
        notes=tx.notes or None,
    )
