"""Unit endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import UnitCreate, UnitRead, UnitUpdate
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.unit_service import UnitService

router = APIRouter(tags=["Units"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> UnitService:
    return UnitService(session)


@router.get("/courses/{course_id}/units", response_model=Page[UnitRead])
async def list_units(
    course_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: UnitService = Depends(get_service),
):
    items, total = await service.list_units(
        context,
        course_id,
        page=pagination.page,
        page_size=pagination.page_size,
        status=status,
        search=search or pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/units/{unit_id}", response_model=UnitRead)
async def get_unit(
    unit_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: UnitService = Depends(get_service),
):
    return await service.get_unit(context, unit_id)


@router.get("/units/{unit_id}/detail", response_model=UnitRead)
async def get_unit_detail(
    unit_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: UnitService = Depends(get_service),
):
    return await service.get_unit_detail(context, unit_id)


@router.post("/courses/{course_id}/units", response_model=UnitRead, status_code=status.HTTP_201_CREATED)
async def create_unit(
    course_id: UUID,
    data: UnitCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: UnitService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    unit = await service.create_unit(context, course_id, data)
    await session.commit()
    return unit


@router.patch("/units/{unit_id}", response_model=UnitRead)
async def update_unit(
    unit_id: UUID,
    data: UnitUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: UnitService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    unit = await service.update_unit(context, unit_id, data)
    await session.commit()
    return unit


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: UnitService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_unit(context, unit_id)
    await session.commit()


@router.post("/courses/{course_id}/units/reorder", response_model=List[UnitRead])
async def reorder_units(
    course_id: UUID,
    unit_ids: List[UUID],
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: UnitService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    units = await service.reorder_units(context, course_id, unit_ids)
    await session.commit()
    return units