"""Dashboard routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.api.schemas.dashboard import DashboardStats
from app.application.services.dashboard_service import DashboardService
from app.domain.entities import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> DashboardStats:
    svc = DashboardService(session)
    stats = await svc.get_stats()
    return DashboardStats(**stats)
