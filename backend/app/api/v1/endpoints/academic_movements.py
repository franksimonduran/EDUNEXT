"""Academic movement history endpoints."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.academic import AcademicMovementRead
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.enrollment_service import EnrollmentService

router = APIRouter(prefix="/academic-movements", tags=["Academic Movements"])

MovementTypeQuery = Literal[
    "enrollment", "transfer", "withdrawal", "completion", "reentry", "correction"
]


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> EnrollmentService:
    return EnrollmentService(session)


@router.get("", response_model=Page[AcademicMovementRead])
async def list_movements(
    pagination: PaginationParams = Depends(get_pagination),
    student_id: Optional[UUID] = Query(default=None),
    enrollment_id: Optional[UUID] = Query(default=None),
    classroom_id: Optional[UUID] = Query(default=None),
    movement_type: Optional[MovementTypeQuery] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.ACADEMIC_MOVEMENTS_READ_INSTITUTION)
    ),
    service: EnrollmentService = Depends(get_service),
):
    items, total = await service.list_movements(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        student_id=student_id,
        enrollment_id=enrollment_id,
        movement_type=movement_type,
        classroom_id=classroom_id,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )
