"""Practice endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.practice import (
    PracticeCreate,
    PracticeRead,
    PracticeUpdate,
    PracticeStatus,
    PracticeDetail,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.practice_service import PracticeService

router = APIRouter(tags=["Practices"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> PracticeService:
    return PracticeService(session)


@router.get("/practices", response_model=Page[PracticeRead])
async def list_practices(
    pagination: PaginationParams = Depends(get_pagination),
    course_id: Optional[UUID] = Query(default=None),
    unit_id: Optional[UUID] = Query(default=None),
    lesson_id: Optional[UUID] = Query(default=None),
    practice_type: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeService = Depends(get_service),
):
    items, total = await service.list_practices(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        unit_id=unit_id,
        lesson_id=lesson_id,
        practice_type=practice_type,
        difficulty=difficulty,
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


@router.get("/practices/{practice_id}", response_model=PracticeRead)
async def get_practice(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeService = Depends(get_service),
):
    return await service.get_practice(context, practice_id)


@router.get("/practices/{practice_id}/detail", response_model=PracticeDetail)
async def get_practice_detail(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeService = Depends(get_service),
):
    return await service.get_practice_detail(context, practice_id)


@router.post("/practices", response_model=PracticeRead, status_code=status.HTTP_201_CREATED)
async def create_practice(
    data: PracticeCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_CREATE)
    ),
    service: PracticeService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    practice = await service.create_practice(context, data)
    await session.commit()
    return practice


@router.patch("/practices/{practice_id}", response_model=PracticeRead)
async def update_practice(
    practice_id: UUID,
    data: PracticeUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: PracticeService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    practice = await service.update_practice(context, practice_id, data)
    await session.commit()
    return practice


@router.post("/practices/{practice_id}/archive", response_model=PracticeRead)
async def archive_practice(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: PracticeService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    practice = await service.archive_practice(context, practice_id)
    await session.commit()
    return practice


@router.post("/practices/{practice_id}/submit-review", response_model=PracticeRead)
async def submit_practice_for_review(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: PracticeService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    practice = await service.submit_for_review(context, practice_id)
    await session.commit()
    return practice


@router.get("/courses/{course_id}/practices", response_model=Page[PracticeRead])
async def list_course_practices(
    course_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    practice_type: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeService = Depends(get_service),
):
    items, total = await service.list_practices(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        practice_type=practice_type,
        difficulty=difficulty,
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