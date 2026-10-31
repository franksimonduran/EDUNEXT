"""Subject endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import SubjectCreate, SubjectRead, SubjectUpdate
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.subject_service import SubjectService

router = APIRouter(tags=["Subjects"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> SubjectService:
    return SubjectService(session)


@router.get("/subjects", response_model=Page[SubjectRead])
async def list_subjects(
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_READ)
    ),
    service: SubjectService = Depends(get_service),
):
    items, total = await service.list_subjects(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        status=status,
        search=search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/subjects/{subject_id}", response_model=SubjectRead)
async def get_subject(
    subject_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_READ)
    ),
    service: SubjectService = Depends(get_service),
):
    return await service.get_subject(context, subject_id)


@router.post("/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
async def create_subject(
    data: SubjectCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_CREATE)
    ),
    service: SubjectService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    subject = await service.create_subject(context, data)
    await session.commit()
    return subject


@router.patch("/subjects/{subject_id}", response_model=SubjectRead)
async def update_subject(
    subject_id: UUID,
    data: SubjectUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: SubjectService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    subject = await service.update_subject(context, subject_id, data)
    await session.commit()
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_DELETE)
    ),
    service: SubjectService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_subject(context, subject_id)
    await session.commit()