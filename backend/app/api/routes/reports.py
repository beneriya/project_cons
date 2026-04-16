"""Reports routes - export data for PDF/Excel."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.api.dependencies import get_current_user, get_db
from app.application.services.dashboard_service import DashboardService
from app.application.services.material_service import MaterialService
from app.domain.entities import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/materials/excel")
async def export_materials_excel(
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Export materials list as Excel."""
    try:
        import openpyxl
    except ImportError:
        from fastapi import HTTPException
        raise HTTPException(500, "openpyxl not installed")

    svc = MaterialService(session)
    materials = await svc.list_materials()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Materials"
    ws.append(["Name", "Type", "m²/Box", "Pieces/Box", "Quantity", "Price", "Min Threshold", "Status"])

    for m in materials:
        status = m.stock_status().value
        ws.append([m.name, m.type.value, m.m2_per_box, m.pieces_per_box, m.quantity, m.price, m.min_threshold, status])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=materials.xlsx"},
    )
