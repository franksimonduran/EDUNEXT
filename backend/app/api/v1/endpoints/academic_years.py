"""Academic year endpoints."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import AcademicYearCreate, AcademicYearRead, AcademicYearUpdate
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.academic_structure_service import AcademicStructureService

router = APIRouter(prefix="/academic-years", tags=["Academic Years"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AcademicStructureService:
    return AcademicStructureService(session)


@router.get("", response_model=Page[AcademicYearRead])
async def list_academic_years(
    pagination: PaginationParams = Depends(get_pagination),
    year_status: Optional[Literal["draft", "planned", "active", "closed", "archived"]] = Query(
        default=None,
        alias="status",
    ),
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_YEARS_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    items, total = await service.list_years(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        status=year_status,
        search=pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/{year_id}", response_model=AcademicYearRead)
async def get_academic_year(
    year_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_YEARS_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    return await service.get_year(context, year_id)


@router.post("", response_model=AcademicYearRead, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    data: AcademicYearCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_YEARS_MANAGE)),
    service: AcademicStructureService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    year = await service.create_year(context, data)
    await session.commit()
    return year


@router.patch("/{year_id}", response_model=AcademicYearRead)
async def update_academic_year(
    year_id: UUID,
    data: AcademicYearUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.ACADEMIC_YEARS_MANAGE)),
    service: AcademicStructureService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    year = await service.update_year(context, year_id, data)
    await session.commit()
    return year
