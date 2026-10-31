"""Content review endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import (
    ContentReviewSubmit,
    ContentReviewDecisionRequest,
    ContentReviewRead,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.content_review_service import ContentReviewService

router = APIRouter(tags=["Content Reviews"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> ContentReviewService:
    return ContentReviewService(session)


@router.get("/content-reviews", response_model=Page[ContentReviewRead])
async def list_reviews(
    pagination: PaginationParams = Depends(get_pagination),
    content_version_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_REVIEW_INSTITUTION)
    ),
    service: ContentReviewService = Depends(get_service),
):
    items, total = await service.list_reviews(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        content_version_id=content_version_id,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/content-reviews/{review_id}", response_model=ContentReviewRead)
async def get_review(
    review_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_REVIEW_INSTITUTION)
    ),
    service: ContentReviewService = Depends(get_service),
):
    return await service.get_review(context, review_id)


@router.post("/content-reviews/submit", response_model=ContentReviewRead, status_code=status.HTTP_201_CREATED)
async def submit_for_review(
    data: ContentReviewSubmit,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: ContentReviewService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    review = await service.submit_for_review(context, data)
    await session.commit()
    return review


@router.post("/content-reviews/{review_id}/start", response_model=ContentReviewRead)
async def start_review(
    review_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_REVIEW_INSTITUTION)
    ),
    service: ContentReviewService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    review = await service.start_review(context, review_id)
    await session.commit()
    return review


@router.post("/content-reviews/{review_id}/decide", response_model=ContentReviewRead)
async def submit_decision(
    review_id: UUID,
    data: ContentReviewDecisionRequest,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_REVIEW_INSTITUTION)
    ),
    service: ContentReviewService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    review = await service.submit_decision(context, review_id, data)
    await session.commit()
    return review


@router.get("/monitors/me/reviews", response_model=Page[ContentReviewRead])
async def list_my_reviews(
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_REVIEW_INSTITUTION)
    ),
    service: ContentReviewService = Depends(get_service),
):
    items, total = await service.get_my_reviews(
        context,
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


@router.get("/reviewers/me/pending", response_model=List[ContentReviewRead])
async def get_pending_reviews(
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_REVIEW_INSTITUTION)
    ),
    service: ContentReviewService = Depends(get_service),
):
    return await service.get_pending_reviews(context)