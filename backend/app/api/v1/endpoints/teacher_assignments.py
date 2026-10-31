"""Teacher assignment endpoints."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import (
    TeacherAssignmentCreate,
    TeacherAssignmentRead,
    TeacherAssignmentUpdate,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.teacher_assignment_service import TeacherAssignmentService

router = APIRouter(prefix="/teacher-assignments", tags=["Teacher Assignments"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> TeacherAssignmentService:
    return TeacherAssignmentService(session)


@router.get("", response_model=Page[TeacherAssignmentRead])
async def list_teacher_assignments(
    pagination: PaginationParams = Depends(get_pagination),
    monitor_id: Optional[UUID] = Query(default=None),
    classroom_id: Optional[UUID] = Query(default=None),
    course_id: Optional[UUID] = Query(default=None),
    period_id: Optional[UUID] = Query(default=None),
    academic_year_id: Optional[UUID] = Query(default=None),
    assignment_status: Optional[
        Literal["planned", "active", "completed", "revoked", "cancelled"]
    ] = Query(default=None, alias="status"),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.TEACHER_ASSIGNMENTS_READ_INSTITUTION,
            Permissions.TEACHER_ASSIGNMENTS_READ_OWN,
            Permissions.TEACHER_ASSIGNMENTS_READ,
        )
    ),
    service: TeacherAssignmentService = Depends(get_service),
):
    items, total = await service.list_assignments(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        monitor_id=monitor_id,
        classroom_id=classroom_id,
        course_id=course_id,
        period_id=period_id,
        academic_year_id=academic_year_id,
        status=assignment_status,
        search=pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/{assignment_id}", response_model=TeacherAssignmentRead)
async def get_teacher_assignment(
    assignment_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.TEACHER_ASSIGNMENTS_READ_INSTITUTION,
            Permissions.TEACHER_ASSIGNMENTS_READ_OWN,
            Permissions.TEACHER_ASSIGNMENTS_READ,
        )
    ),
    service: TeacherAssignmentService = Depends(get_service),
):
    return await service.get_assignment(context, assignment_id)


@router.post(
    "",
    response_model=TeacherAssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_teacher_assignment(
    data: TeacherAssignmentCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION)
    ),
    service: TeacherAssignmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assignment = await service.create_assignment(context, data)
    await session.commit()
    return assignment


@router.patch("/{assignment_id}", response_model=TeacherAssignmentRead)
async def update_teacher_assignment(
    assignment_id: UUID,
    data: TeacherAssignmentUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION)
    ),
    service: TeacherAssignmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assignment = await service.update_assignment(context, assignment_id, data)
    await session.commit()
    return assignment


@router.post("/{assignment_id}/revoke", response_model=TeacherAssignmentRead)
async def revoke_teacher_assignment(
    assignment_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION)
    ),
    service: TeacherAssignmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assignment = await service.revoke_assignment(context, assignment_id)
    await session.commit()
    return assignment
