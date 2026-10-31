"""Practice attempt endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.practice import (
    PracticeAttemptCreate,
    PracticeAttemptRead,
    PracticeAttemptDetail,
    PracticeResponseCreate,
    PracticeResponseRead,
    PracticeResultRead,
    PracticeResultDetail,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.practice_attempt_service import PracticeAttemptService

router = APIRouter(tags=["Practice Attempts"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> PracticeAttemptService:
    return PracticeAttemptService(session)


@router.get("/practice-attempts", response_model=Page[PracticeAttemptRead])
async def list_attempts(
    pagination: PaginationParams = Depends(get_pagination),
    practice_id: Optional[UUID] = Query(default=None),
    student_profile_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    items, total = await service.list_attempts(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        practice_id=practice_id,
        student_profile_id=student_profile_id,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/practice-attempts/{attempt_id}", response_model=PracticeAttemptRead)
async def get_attempt(
    attempt_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    return await service.get_attempt(context, attempt_id)


@router.get("/practice-attempts/{attempt_id}/detail", response_model=PracticeAttemptDetail)
async def get_attempt_detail(
    attempt_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    return await service.get_attempt(context, attempt_id)


@router.post("/practices/{practice_id}/attempts", response_model=PracticeAttemptDetail, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    practice_id: UUID,
    data: PracticeAttemptCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: PracticeAttemptService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    data.practice_id = practice_id
    attempt = await service.start_attempt(context, data)
    await session.commit()
    return attempt


@router.put("/practice-attempts/{attempt_id}/responses/{exercise_id}", response_model=PracticeResponseRead)
async def save_response(
    attempt_id: UUID,
    exercise_id: UUID,
    data: PracticeResponseCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: PracticeAttemptService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    response = await service.save_response(context, attempt_id, exercise_id, data)
    await session.commit()
    return response


@router.post("/practice-attempts/{attempt_id}/submit", response_model=PracticeAttemptDetail)
async def submit_attempt(
    attempt_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: PracticeAttemptService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    attempt = await service.submit_attempt(context, attempt_id)
    await session.commit()
    return attempt


@router.post("/practice-attempts/{attempt_id}/cancel", response_model=PracticeAttemptRead)
async def cancel_attempt(
    attempt_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: PracticeAttemptService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    attempt = await service.cancel_attempt(context, attempt_id)
    await session.commit()
    return attempt


@router.get("/practice-attempts/{attempt_id}/result", response_model=PracticeResultDetail)
async def get_attempt_result(
    attempt_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    attempt = await service.get_attempt(context, attempt_id)
    if not attempt.result:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Result not found for this attempt")
    return attempt.result


@router.get("/practice-results", response_model=Page[PracticeResultRead])
async def list_results(
    pagination: PaginationParams = Depends(get_pagination),
    practice_id: Optional[UUID] = Query(default=None),
    student_profile_id: Optional[UUID] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    items, total = await service.result_repo.list_results(
        institution_id=context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        practice_id=practice_id,
        student_profile_id=student_profile_id,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/practice-results/{result_id}", response_model=PracticeResultDetail)
async def get_result(
    result_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    return await service.result_repo.get_result(context.institution_id, result_id)


@router.get("/students/me/practice-results", response_model=Page[PracticeResultRead])
async def get_my_results(
    pagination: PaginationParams = Depends(get_pagination),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: PracticeAttemptService = Depends(get_service),
):
    # Get student profile
    from app.db.models import StudentProfile
    from sqlalchemy import select
    student_profile = await service.session.execute(
        select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
    )
    student_profile = student_profile.scalars().first()
    if not student_profile:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Student profile not found")

    items, total = await service.result_repo.list_results(
        institution_id=context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        student_profile_id=student_profile.id,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )