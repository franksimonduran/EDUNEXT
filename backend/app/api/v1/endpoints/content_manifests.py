"""Content manifest endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import ContentManifestCreate, ContentManifestRead
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.content_manifest_service import ContentManifestService

router = APIRouter(tags=["Content Manifests"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> ContentManifestService:
    return ContentManifestService(session)


@router.get("/content-manifests", response_model=Page[ContentManifestRead])
async def list_manifests(
    pagination: PaginationParams = Depends(get_pagination),
    course_id: Optional[UUID] = Query(default=None),
    grade_id: Optional[UUID] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.CONTENT_PUBLISH_INSTITUTION,
        )
    ),
    service: ContentManifestService = Depends(get_service),
):
    items, total = await service.list_manifests(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        grade_id=grade_id,
        is_active=is_active,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/content-manifests/{manifest_id}", response_model=ContentManifestRead)
async def get_manifest(
    manifest_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.CONTENT_PUBLISH_INSTITUTION,
        )
    ),
    service: ContentManifestService = Depends(get_service),
):
    return await service.get_manifest(context, manifest_id)


@router.post("/content-manifests", response_model=ContentManifestRead, status_code=status.HTTP_201_CREATED)
async def generate_manifest(
    data: ContentManifestCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_PUBLISH_INSTITUTION)
    ),
    service: ContentManifestService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    manifest = await service.generate_manifest(context, data)
    await session.commit()
    return manifest


@router.get("/content-manifests/{manifest_id}/verify")
async def verify_manifest(
    manifest_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.CONTENT_PUBLISH_INSTITUTION,
        )
    ),
    service: ContentManifestService = Depends(get_service),
):
    return await service.verify_manifest_integrity(context, manifest_id)


@router.get("/students/me/manifests", response_model=List[ContentManifestRead])
async def get_student_manifests(
    grade_id: UUID = Query(...),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: ContentManifestService = Depends(get_service),
):
    return await service.get_student_manifests(context, grade_id)