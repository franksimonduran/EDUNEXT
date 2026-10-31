"""Content publication endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import (
    ContentPublicationCreate,
    ContentPublicationUpdate,
    ContentPublicationWithdraw,
    ContentPublicationRead,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.content_publication_service import ContentPublicationService

router = APIRouter(tags=["Content Publications"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> ContentPublicationService:
    return ContentPublicationService(session)


@router.get("/content-publications", response_model=Page[ContentPublicationRead])
async def list_publications(
    pagination: PaginationParams = Depends(get_pagination),
    content_version_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    visibility: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentPublicationService = Depends(get_service),
):
    items, total = await service.list_publications(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        content_version_id=content_version_id,
        status=status,
        visibility=visibility,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/content-publications/{publication_id}", response_model=ContentPublicationRead)
async def get_publication(
    publication_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentPublicationService = Depends(get_service),
):
    return await service.get_publication(context, publication_id)


@router.post("/content-versions/{version_id}/publish", response_model=ContentPublicationRead, status_code=status.HTTP_201_CREATED)
async def publish_version(
    version_id: UUID,
    data: ContentPublicationCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentPublicationService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    # Ensure version_id matches
    data.content_version_id = version_id
    publication = await service.publish_version(context, data)
    await session.commit()
    return publication


@router.patch("/content-publications/{publication_id}", response_model=ContentPublicationRead)
async def update_publication(
    publication_id: UUID,
    data: ContentPublicationUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentPublicationService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    publication = await service.update_publication(context, publication_id, data)
    await session.commit()
    return publication


@router.post("/content-publications/{publication_id}/withdraw", response_model=ContentPublicationRead)
async def withdraw_publication(
    publication_id: UUID,
    data: ContentPublicationWithdraw,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentPublicationService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    publication = await service.withdraw_publication(context, publication_id, data)
    await session.commit()
    return publication


@router.post("/content-publications/{old_publication_id}/supersede/{new_version_id}", response_model=ContentPublicationRead)
async def supersede_publication(
    old_publication_id: UUID,
    new_version_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentPublicationService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    publication = await service.supersede_publication(context, old_publication_id, new_version_id)
    await session.commit()
    return publication