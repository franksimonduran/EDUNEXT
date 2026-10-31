"""Academic period endpoints."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import (
    AcademicPeriodCreate,
    AcademicPeriodRead,
    AcademicPeriodUpdate,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.academic_structure_service import AcademicStructureService

router = APIRouter(prefix="/academic-periods", tags=["Academic Periods"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AcademicStructureService:
    return AcademicStructureService(session)


@router.get("", response_model=Page[AcademicPeriodRead])
async def list_academic_periods(
    pagination: PaginationParams = Depends(get_pagination),
    academic_year_id: Optional[UUID] = Query(default=None),
    period_status: Optional[Literal["draft", "planned", "active", "closed", "archived"]] = Query(
        default=None,
        alias="status",
    ),
    period_type: Optional[Literal["semester", "trimester", "quarter", "bimester", "custom"]] = Query(
        default=None
    ),
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_PERIODS_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    items, total = await service.list_periods(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        academic_year_id=academic_year_id,
        status=period_status,
        period_type=period_type,
        search=pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/{period_id}", response_model=AcademicPeriodRead)
async def get_academic_period(
    period_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_PERIODS_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    return await service.get_period(context, period_id)


@router.post("", response_model=AcademicPeriodRead, status_code=status.HTTP_201_CREATED)
async def create_academic_period(
    data: AcademicPeriodCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_PERIODS_MANAGE)),
    service: AcademicStructureService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    period = await service.create_period(context, data)
    await session.commit()
    return period


@router.patch("/{period_id}", response_model=AcademicPeriodRead)
async def update_academic_period(
    period_id: UUID,
    data: AcademicPeriodUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_PERIODS_MANAGE)),
    service: AcademicStructureService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    period = await service.update_period(context, period_id, data)
    await session.commit()
    return period
