"""Material routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.api.schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate
from app.application.services.material_service import MaterialService
from app.domain.entities import User

router = APIRouter(prefix="/materials", tags=["materials"])


def _material_to_response(m) -> MaterialResponse:
    status_val = m.stock_status().value if hasattr(m, "stock_status") else "in_stock"
    if status_val == "in_stock":
        status_str = "in_stock"
    elif status_val == "low_stock":
        status_str = "low_stock"
    else:
        status_str = "out_of_stock"
    return MaterialResponse(
        id=str(m.id),
        name=m.name,
        type=m.type.value,
        m2_per_box=m.m2_per_box,
        pieces_per_box=m.pieces_per_box,
        quantity=m.quantity,
        price=m.price,
        min_threshold=m.min_threshold,
        status=status_str,
    )


@router.get("", response_model=list[MaterialResponse])
async def list_materials(
    search: str | None = None,
    type: str | None = None,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[MaterialResponse]:
    svc = MaterialService(session)
    materials = await svc.list_materials(search=search, type_filter=type)
    return [_material_to_response(m) for m in materials]


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: str,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> MaterialResponse:
    svc = MaterialService(session)
    material = await svc.get_material(UUID(material_id))
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return _material_to_response(material)


@router.post("", response_model=MaterialResponse, status_code=201)
async def create_material(
    body: MaterialCreate,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> MaterialResponse:
    svc = MaterialService(session)
    try:
        material = await svc.create_material(
            name=body.name,
            type=body.type,
            m2_per_box=body.m2_per_box,
            pieces_per_box=body.pieces_per_box,
            quantity=body.quantity,
            price=body.price,
            min_threshold=body.min_threshold,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _material_to_response(material)


@router.patch("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str,
    body: MaterialUpdate,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> MaterialResponse:
    svc = MaterialService(session)
    updates = body.model_dump(exclude_unset=True)
    try:
        material = await svc.update_material(UUID(material_id), **updates)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return _material_to_response(material)


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: str,
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    svc = MaterialService(session)
    ok = await svc.delete_material(UUID(material_id))
    if not ok:
        raise HTTPException(status_code=404, detail="Material not found")
