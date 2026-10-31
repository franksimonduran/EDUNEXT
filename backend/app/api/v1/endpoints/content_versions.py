"""Content version endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import ContentVersionCreate, ContentVersionRead
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.content_version_service import ContentVersionService

router = APIRouter(tags=["Content Versions"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> ContentVersionService:
    return ContentVersionService(session)


@router.get("/lessons/{lesson_id}/versions", response_model=Page[ContentVersionRead])
async def list_lesson_versions(
    lesson_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: ContentVersionService = Depends(get_service),
):
    items, total = await service.list_versions(
        context,
        content_type="lesson",
        content_id=lesson_id,
        page=pagination.page,
        page_size=pagination.page_size,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/units/{unit_id}/versions", response_model=Page[ContentVersionRead])
async def list_unit_versions(
    unit_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: ContentVersionService = Depends(get_service),
):
    items, total = await service.list_versions(
        context,
        content_type="unit",
        content_id=unit_id,
        page=pagination.page,
        page_size=pagination.page_size,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/courses/{course_id}/versions", response_model=Page[ContentVersionRead])
async def list_course_versions(
    course_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: ContentVersionService = Depends(get_service),
):
    items, total = await service.list_versions(
        context,
        content_type="course",
        content_id=course_id,
        page=pagination.page,
        page_size=pagination.page_size,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/content-versions/{version_id}", response_model=ContentVersionRead)
async def get_version(
    version_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: ContentVersionService = Depends(get_service),
):
    return await service.get_version(context, version_id)


@router.get("/lessons/{lesson_id}/versions/latest", response_model=ContentVersionRead)
async def get_latest_lesson_version(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: ContentVersionService = Depends(get_service),
):
    version = await service.get_latest_version(context, "lesson", lesson_id)
    if not version:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("No versions found for this lesson")
    return version


@router.get("/lessons/{lesson_id}/versions/published", response_model=ContentVersionRead)
async def get_published_lesson_version(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: ContentVersionService = Depends(get_service),
):
    version = await service.get_published_version(context, "lesson", lesson_id)
    if not version:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("No published version found for this lesson")
    return version


@router.post("/lessons/{lesson_id}/versions", response_model=ContentVersionRead, status_code=status.HTTP_201_CREATED)
async def create_lesson_version(
    lesson_id: UUID,
    data: ContentVersionCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: ContentVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.create_version(context, "lesson", lesson_id, data)
    await session.commit()
    return version


@router.post("/units/{unit_id}/versions", response_model=ContentVersionRead, status_code=status.HTTP_201_CREATED)
async def create_unit_version(
    unit_id: UUID,
    data: ContentVersionCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: ContentVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.create_version(context, "unit", unit_id, data)
    await session.commit()
    return version


@router.post("/courses/{course_id}/versions", response_model=ContentVersionRead, status_code=status.HTTP_201_CREATED)
async def create_course_version(
    course_id: UUID,
    data: ContentVersionCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: ContentVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.create_version(context, "course", course_id, data)
    await session.commit()
    return version


@router.patch("/content-versions/{version_id}", response_model=ContentVersionRead)
async def update_version(
    version_id: UUID,
    data: dict,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: ContentVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.update_version(context, version_id, data)
    await session.commit()
    return version


@router.delete("/content-versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(
    version_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: ContentVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_version(context, version_id)
    await session.commit()