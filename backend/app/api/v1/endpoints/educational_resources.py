"""Educational resource endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import (
    ResourceCreate,
    ResourceRead,
    ResourceUpdate,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.educational_resource_service import EducationalResourceService

router = APIRouter(tags=["Educational Resources"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> EducationalResourceService:
    return EducationalResourceService(session)


@router.get("/resources", response_model=Page[ResourceRead])
async def list_resources(
    pagination: PaginationParams = Depends(get_pagination),
    course_id: Optional[UUID] = Query(default=None),
    resource_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: EducationalResourceService = Depends(get_service),
):
    items, total = await service.list_resources(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        resource_type=resource_type,
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


@router.get("/resources/{resource_id}", response_model=ResourceRead)
async def get_resource(
    resource_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: EducationalResourceService = Depends(get_service),
):
    return await service.get_resource(context, resource_id)


@router.get("/resources/{resource_id}/detail", response_model=ResourceRead)
async def get_resource_detail(
    resource_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: EducationalResourceService = Depends(get_service),
):
    return await service.get_resource_detail(context, resource_id)


@router.post("/resources", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
async def create_resource(
    data: ResourceCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: EducationalResourceService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    resource = await service.create_resource(context, data)
    await session.commit()
    return resource


@router.post("/resources/upload", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
async def upload_resource(
    file: UploadFile = File(...),
    resource_type: str = "document",
    course_id: Optional[UUID] = None,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: EducationalResourceService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    # No storage adapter persists bytes yet. Never confirm a fictitious upload.
    # Multipart parsing still needs an upstream body limit before deployment.
    from app.core.exceptions import ServiceUnavailableError
    raise ServiceUnavailableError("Resource file storage is not configured")


@router.patch("/resources/{resource_id}", response_model=ResourceRead)
async def update_resource(
    resource_id: UUID,
    data: ResourceUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: EducationalResourceService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    resource = await service.update_resource(context, resource_id, data)
    await session.commit()
    return resource


@router.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: EducationalResourceService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_resource(context, resource_id)
    await session.commit()


@router.get("/resources/{resource_id}/download")
async def download_resource(
    resource_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
            Permissions.LESSONS_READ,
        )
    ),
    service: EducationalResourceService = Depends(get_service),
):
    await service.get_resource(context, resource_id)
    from app.core.exceptions import ServiceUnavailableError
    raise ServiceUnavailableError("Resource file streaming is not configured")


# Lesson/resource association routes are owned by lessons.router. Registering them
# here also shadowed the runtime handlers and produced conflicting OpenAPI contracts.
