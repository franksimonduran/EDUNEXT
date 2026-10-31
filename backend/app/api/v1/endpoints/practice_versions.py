"""Practice version endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.practice import PracticeVersionRead, PracticeVersionDetail
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.practice_version_service import PracticeVersionService

router = APIRouter(tags=["Practice Versions"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> PracticeVersionService:
    return PracticeVersionService(session)


@router.get("/practices/{practice_id}/versions", response_model=Page[PracticeVersionRead])
async def list_practice_versions(
    practice_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeVersionService = Depends(get_service),
):
    items, total = await service.list_versions(
        context,
        practice_id,
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


@router.get("/practices/{practice_id}/versions/latest", response_model=PracticeVersionDetail)
async def get_latest_practice_version(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeVersionService = Depends(get_service),
):
    version = await service.get_latest_version(context, practice_id)
    if not version:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("No versions found for this practice")
    return version


@router.get("/practices/{practice_id}/versions/published", response_model=PracticeVersionDetail)
async def get_published_practice_version(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeVersionService = Depends(get_service),
):
    version = await service.get_published_version(context, practice_id)
    if not version:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("No published version found for this practice")
    return version


@router.get("/practice-versions/{version_id}", response_model=PracticeVersionDetail)
async def get_practice_version(
    version_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: PracticeVersionService = Depends(get_service),
):
    return await service.get_version(context, version_id)


@router.post("/practices/{practice_id}/versions", response_model=PracticeVersionDetail, status_code=status.HTTP_201_CREATED)
async def create_practice_version(
    practice_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: PracticeVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.create_version(context, practice_id)
    await session.commit()
    return version


@router.patch("/practice-versions/{version_id}", response_model=PracticeVersionDetail)
async def update_practice_version(
    version_id: UUID,
    data: dict,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: PracticeVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.update_version(context, version_id, data)
    await session.commit()
    return version


@router.post("/practice-versions/{version_id}/publish", response_model=PracticeVersionDetail)
async def publish_practice_version(
    version_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: PracticeVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    version = await service.publish_version(context, version_id)
    await session.commit()
    return version


@router.delete("/practice-versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_practice_version(
    version_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: PracticeVersionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_version(context, version_id)
    await session.commit()