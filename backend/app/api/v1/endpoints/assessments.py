"""Assessment endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentRead,
    AssessmentUpdate,
    AssessmentDetail,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Assessments"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AssessmentService:
    return AssessmentService(session)


@router.get("/assessments", response_model=Page[AssessmentRead])
async def list_assessments(
    pagination: PaginationParams = Depends(get_pagination),
    course_id: Optional[UUID] = Query(default=None),
    unit_id: Optional[UUID] = Query(default=None),
    assessment_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: AssessmentService = Depends(get_service),
):
    items, total = await service.list_assessments(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        unit_id=unit_id,
        assessment_type=assessment_type,
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


@router.get("/assessments/{assessment_id}", response_model=AssessmentRead)
async def get_assessment(
    assessment_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: AssessmentService = Depends(get_service),
):
    return await service.get_assessment(context, assessment_id)


@router.get("/assessments/{assessment_id}/detail", response_model=AssessmentDetail)
async def get_assessment_detail(
    assessment_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: AssessmentService = Depends(get_service),
):
    return await service.get_assessment_detail(context, assessment_id)


@router.post("/assessments", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    data: AssessmentCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_CREATE)
    ),
    service: AssessmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assessment = await service.create_assessment(context, data)
    await session.commit()
    return assessment


@router.patch("/assessments/{assessment_id}", response_model=AssessmentRead)
async def update_assessment(
    assessment_id: UUID,
    data: AssessmentUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: AssessmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assessment = await service.update_assessment(context, assessment_id, data)
    await session.commit()
    return assessment


@router.post("/assessments/{assessment_id}/publish", response_model=AssessmentRead)
async def publish_assessment(
    assessment_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: AssessmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assessment = await service.publish_assessment(context, assessment_id)
    await session.commit()
    return assessment


@router.post("/assessments/{assessment_id}/archive", response_model=AssessmentRead)
async def archive_assessment(
    assessment_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: AssessmentService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    assessment = await service.archive_assessment(context, assessment_id)
    await session.commit()
    return assessment
