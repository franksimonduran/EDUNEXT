"""Lesson endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import (
    LessonCreate,
    LessonRead,
    LessonUpdate,
    LessonResourceCreate,
    LessonResourceRead,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.lesson_service import LessonService

router = APIRouter(tags=["Lessons"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> LessonService:
    return LessonService(session)


@router.get("/units/{unit_id}/lessons", response_model=Page[LessonRead])
async def list_lessons(
    unit_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: LessonService = Depends(get_service),
):
    items, total = await service.list_lessons(
        context,
        unit_id,
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


@router.get("/lessons/{lesson_id}", response_model=LessonRead)
async def get_lesson(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: LessonService = Depends(get_service),
):
    return await service.get_lesson(context, lesson_id)


@router.get("/lessons/{lesson_id}/detail", response_model=LessonRead)
async def get_lesson_detail(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: LessonService = Depends(get_service),
):
    return await service.get_lesson_detail(context, lesson_id)


@router.post("/units/{unit_id}/lessons", response_model=LessonRead, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    unit_id: UUID,
    data: LessonCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: LessonService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    lesson = await service.create_lesson(context, unit_id, data)
    await session.commit()
    return lesson


@router.patch("/lessons/{lesson_id}", response_model=LessonRead)
async def update_lesson(
    lesson_id: UUID,
    data: LessonUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: LessonService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    lesson = await service.update_lesson(context, lesson_id, data)
    await session.commit()
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: LessonService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_lesson(context, lesson_id)
    await session.commit()


@router.post("/units/{unit_id}/lessons/reorder", response_model=List[LessonRead])
async def reorder_lessons(
    unit_id: UUID,
    lesson_ids: List[UUID],
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: LessonService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    lessons = await service.reorder_lessons(context, unit_id, lesson_ids)
    await session.commit()
    return lessons


@router.post("/lessons/{lesson_id}/resources", response_model=LessonResourceRead, status_code=status.HTTP_201_CREATED)
async def add_resource_to_lesson(
    lesson_id: UUID,
    data: LessonResourceCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: LessonService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    lr = await service.add_resource_to_lesson(
        context,
        lesson_id,
        data.resource_id,
        data.order,
        data.is_required,
        data.usage_context,
    )
    await session.commit()
    return lr


@router.delete("/lessons/{lesson_id}/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_resource_from_lesson(
    lesson_id: UUID,
    resource_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: LessonService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.remove_resource_from_lesson(context, lesson_id, resource_id)
    await session.commit()