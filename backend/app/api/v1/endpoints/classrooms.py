"""Classroom and monitor-classroom endpoints."""

from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import (
    ClassroomCreate,
    ClassroomDetail,
    ClassroomRead,
    ClassroomStudentRead,
    ClassroomUpdate,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.classroom_service import ClassroomService

router = APIRouter(tags=["Classrooms"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> ClassroomService:
    return ClassroomService(session)


@router.get("/classrooms", response_model=Page[ClassroomRead])
async def list_classrooms(
    pagination: PaginationParams = Depends(get_pagination),
    academic_year_id: Optional[UUID] = Query(default=None),
    grade_id: Optional[UUID] = Query(default=None),
    section_id: Optional[UUID] = Query(default=None),
    classroom_status: Optional[Literal["active", "inactive", "archived"]] = Query(
        default=None,
        alias="status",
    ),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CLASSROOMS_READ_INSTITUTION,
            Permissions.CLASSROOMS_READ_ASSIGNED,
        )
    ),
    service: ClassroomService = Depends(get_service),
):
    items, total = await service.list_classrooms(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        academic_year_id=academic_year_id,
        grade_id=grade_id,
        section_id=section_id,
        status=classroom_status,
        search=pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/classrooms/{classroom_id}", response_model=ClassroomDetail)
async def get_classroom(
    classroom_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CLASSROOMS_READ_INSTITUTION,
            Permissions.CLASSROOMS_READ_ASSIGNED,
        )
    ),
    service: ClassroomService = Depends(get_service),
):
    return await service.get_detail(context, classroom_id)


@router.get("/classrooms/{classroom_id}/students", response_model=List[ClassroomStudentRead])
async def list_classroom_students(
    classroom_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CLASSROOMS_READ_INSTITUTION,
            Permissions.CLASSROOMS_READ_ASSIGNED,
        )
    ),
    service: ClassroomService = Depends(get_service),
):
    return await service.list_students(context, classroom_id)


@router.post("/classrooms", response_model=ClassroomRead, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    data: ClassroomCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CLASSROOMS_MANAGE_INSTITUTION)
    ),
    service: ClassroomService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    classroom = await service.create_classroom(context, data)
    await session.commit()
    return classroom


@router.patch("/classrooms/{classroom_id}", response_model=ClassroomRead)
async def update_classroom(
    classroom_id: UUID,
    data: ClassroomUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CLASSROOMS_MANAGE_INSTITUTION)
    ),
    service: ClassroomService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    classroom = await service.update_classroom(context, classroom_id, data)
    await session.commit()
    return classroom


@router.post("/classrooms/{classroom_id}/archive", response_model=ClassroomRead)
async def archive_classroom(
    classroom_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CLASSROOMS_MANAGE_INSTITUTION)
    ),
    service: ClassroomService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    classroom = await service.update_classroom(
        context,
        classroom_id,
        ClassroomUpdate(status="archived"),
    )
    await session.commit()
    return classroom


@router.get("/monitors/me/classrooms", response_model=List[ClassroomRead])
async def list_my_classrooms(
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CLASSROOMS_READ_ASSIGNED,
            Permissions.CLASSROOMS_READ_INSTITUTION,
        )
    ),
    service: ClassroomService = Depends(get_service),
):
    return await service.monitor_classrooms(context)
