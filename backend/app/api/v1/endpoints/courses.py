"""Course endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.content import CourseCreate, CourseRead, CourseUpdate
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.course_service import CourseService

router = APIRouter(tags=["Courses"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> CourseService:
    return CourseService(session)


@router.get("/courses", response_model=Page[CourseRead])
async def list_courses(
    pagination: PaginationParams = Depends(get_pagination),
    grade_id: Optional[UUID] = Query(default=None),
    subject_id: Optional[UUID] = Query(default=None),
    course_status: Optional[str] = Query(default=None, alias="status"),
    visibility: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: CourseService = Depends(get_service),
):
    items, total = await service.list_courses(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        grade_id=grade_id,
        subject_id=subject_id,
        status=course_status,
        visibility=visibility,
        search=search or pagination.search,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/courses/{course_id}", response_model=CourseRead)
async def get_course(
    course_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: CourseService = Depends(get_service),
):
    return await service.get_course(context, course_id)


@router.get("/courses/{course_id}/detail", response_model=CourseRead)
async def get_course_detail(
    course_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: CourseService = Depends(get_service),
):
    return await service.get_course_detail(context, course_id)


@router.post("/courses", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_CREATE)
    ),
    service: CourseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    course = await service.create_course(context, data)
    await session.commit()
    return course


@router.patch("/courses/{course_id}", response_model=CourseRead)
async def update_course(
    course_id: UUID,
    data: CourseUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: CourseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    course = await service.update_course(context, course_id, data)
    await session.commit()
    return course


@router.post("/courses/{course_id}/archive", response_model=CourseRead)
async def archive_course(
    course_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.COURSES_UPDATE)
    ),
    service: CourseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    course = await service.archive_course(context, course_id)
    await session.commit()
    return course


@router.get("/monitors/me/courses", response_model=Page[CourseRead])
async def list_my_courses(
    pagination: PaginationParams = Depends(get_pagination),
    grade_id: Optional[UUID] = Query(default=None),
    subject_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.COURSES_READ,
        )
    ),
    service: CourseService = Depends(get_service),
):
    items, total = await service.list_courses_for_monitor(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        grade_id=grade_id,
        subject_id=subject_id,
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