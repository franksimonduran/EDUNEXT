"""Section management endpoints."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import SectionCreate, SectionRead, SectionUpdate
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.academic_structure_service import AcademicStructureService

router = APIRouter(prefix="/sections", tags=["Sections"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AcademicStructureService:
    return AcademicStructureService(session)


@router.get("", response_model=Page[SectionRead])
async def list_sections(
    pagination: PaginationParams = Depends(get_pagination),
    grade_id: Optional[UUID] = Query(default=None),
    section_status: Optional[Literal["active", "inactive"]] = Query(default=None, alias="status"),
    context: AuthorizationContext = Depends(require_permission(Permissions.SECTIONS_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    items, total = await service.list_sections(
        grade_id=grade_id,
        status=section_status,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/{section_id}", response_model=SectionRead)
async def get_section(
    section_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.SECTIONS_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    return await service.get_section(section_id)


@router.post("", response_model=SectionRead, status_code=status.HTTP_201_CREATED)
async def create_section(
    data: SectionCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.SECTIONS_MANAGE)),
    service: AcademicStructureService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    section = await service.create_section(data)
    await session.commit()
    return section


@router.patch("/{section_id}", response_model=SectionRead)
async def update_section(
    section_id: UUID,
    data: SectionUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.SECTIONS_MANAGE)),
    service: AcademicStructureService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    section = await service.update_section(section_id, data)
    await session.commit()
    return section
