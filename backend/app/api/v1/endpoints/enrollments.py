"""Enrollment lifecycle endpoints."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import (
    EnrollmentCompleteRequest,
    EnrollmentCreate,
    EnrollmentDetail,
    EnrollmentRead,
    EnrollmentTransferRequest,
    EnrollmentUpdate,
    EnrollmentWithdrawRequest,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.enrollment_service import EnrollmentService

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

EnrollmentStatusQuery = Literal[
    "pending",
    "active",
    "transferred",
    "withdrawn",
    "completed",
    "graduated",
    "suspended",
    "cancelled",
]


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> EnrollmentService:
    return EnrollmentService(session)


@router.get("", response_model=Page[EnrollmentRead])
async def list_enrollments(
    pagination: PaginationParams = Depends(get_pagination),
    academic_year_id: Optional[UUID] = Query(default=None),
    classroom_id: Optional[UUID] = Query(default=None),
    grade_id: Optional[UUID] = Query(default=None),
    period_id: Optional[UUID] = Query(default=None),
    student_id: Optional[UUID] = Query(default=None),
    enrollment_status: Optional[EnrollmentStatusQuery] = Query(default=None, alias="status"),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.ENROLLMENTS_READ_INSTITUTION,
            Permissions.ENROLLMENTS_READ_ASSIGNED,
            Permissions.ENROLLMENTS_READ_OWN,
        )
    ),
    service: EnrollmentService = Depends(get_service),
):
    items, total = await service.list_enrollments(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        academic_year_id=academic_year_id,
        classroom_id=classroom_id,
        grade_id=grade_id,
        period_id=period_id,
        student_id=student_id,
        status=enrollment_status,
        search=pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/{enrollment_id}", response_model=EnrollmentDetail)
async def get_enrollment(
    enrollment_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.ENROLLMENTS_READ_INSTITUTION,
            Permissions.ENROLLMENTS_READ_ASSIGNED,
            Permissions.ENROLLMENTS_READ_OWN,
        )
    ),
    service: EnrollmentService = Depends(get_service),
):
    return await service.get_enrollment(context, enrollment_id)


@router.post("", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    data: EnrollmentCreate,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.ENROLLMENTS_CREATE_INSTITUTION)
    ),
    service: EnrollmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    enrollment = await service.create_enrollment(
        context,
        data,
        idempotency_key=idempotency_key,
    )
    await session.commit()
    return enrollment


@router.patch("/{enrollment_id}", response_model=EnrollmentRead)
async def update_enrollment(
    enrollment_id: UUID,
    data: EnrollmentUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.ENROLLMENTS_MANAGE_INSTITUTION)
    ),
    service: EnrollmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    enrollment = await service.update_enrollment(context, enrollment_id, data)
    await session.commit()
    return enrollment


@router.post("/{enrollment_id}/withdraw", response_model=EnrollmentRead)
async def withdraw_enrollment(
    enrollment_id: UUID,
    data: EnrollmentWithdrawRequest,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.ENROLLMENTS_MANAGE_INSTITUTION)
    ),
    service: EnrollmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    enrollment = await service.withdraw_enrollment(context, enrollment_id, data)
    await session.commit()
    return enrollment


@router.post("/{enrollment_id}/complete", response_model=EnrollmentRead)
async def complete_enrollment(
    enrollment_id: UUID,
    data: EnrollmentCompleteRequest,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.ENROLLMENTS_MANAGE_INSTITUTION)
    ),
    service: EnrollmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    enrollment = await service.complete_enrollment(context, enrollment_id, data)
    await session.commit()
    return enrollment


@router.post("/{enrollment_id}/transfer", response_model=EnrollmentRead)
async def transfer_enrollment(
    enrollment_id: UUID,
    data: EnrollmentTransferRequest,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.ENROLLMENTS_TRANSFER_INSTITUTION)
    ),
    service: EnrollmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    enrollment = await service.transfer_enrollment(
        context,
        enrollment_id,
        data,
        idempotency_key=idempotency_key,
    )
    await session.commit()
    return enrollment
