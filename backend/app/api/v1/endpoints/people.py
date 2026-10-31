"""Institution-scoped APIs for users, students, monitors, and memberships."""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.common import Page
from app.schemas.people import (
    InstitutionOut,
    InstitutionUpdate,
    MembershipCreate,
    MembershipOut,
    MembershipUpdate,
    MonitorCreate,
    MonitorOut,
    MonitorUpdate,
    StudentCreate,
    StudentDetail,
    StudentOut,
    StudentUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.people_service import PeopleService, _pages

router = APIRouter()


async def get_people_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> PeopleService:
    return PeopleService(session)


@router.get("/institutions", response_model=list[InstitutionOut], tags=["Institutions"])
async def list_institutions(
    context: AuthorizationContext = Depends(require_permission(Permissions.INSTITUTIONS_READ)),
    service: PeopleService = Depends(get_people_service),
):
    """Return the institution bound to the current session."""
    institution = await service.get_institution(context.institution_id)
    return [institution]


@router.get("/institutions/{institution_id}", response_model=InstitutionOut, tags=["Institutions"])
async def get_institution(
    institution_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.INSTITUTIONS_READ)),
    service: PeopleService = Depends(get_people_service),
):
    if institution_id != context.institution_id:
        raise ForbiddenError("Institution access is restricted to the active session")
    return await service.get_institution(context.institution_id)


@router.patch("/institutions/{institution_id}", response_model=InstitutionOut, tags=["Institutions"])
async def update_institution(
    institution_id: UUID,
    data: InstitutionUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.INSTITUTIONS_MANAGE)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    if institution_id != context.institution_id:
        raise ForbiddenError("Institution access is restricted to the active session")
    institution = await service.update_institution(context.institution_id, data)
    await session.commit()
    return institution


@router.get("/users", response_model=Page[UserOut], tags=["Users"])
async def list_users(
    pagination: PaginationParams = Depends(get_pagination),
    user_status: Optional[str] = Query(default=None, alias="status"),
    sort_by: str = Query(default="display_name"),
    context: AuthorizationContext = Depends(require_permission(Permissions.USERS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    items, total = await service.list_users(
        context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        search=pagination.search,
        status=user_status,
        sort_by=sort_by,
        sort_order=pagination.sort_order,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=_pages(total, pagination.page_size),
    )


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(
    data: UserCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.USERS_CREATE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    user = await service.create_user(context.institution_id, data, context.user_id)
    await session.commit()
    return user


@router.get("/users/{user_id}", response_model=UserOut, tags=["Users"])
async def get_user(
    user_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.USERS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    return await service.get_user(context.institution_id, user_id)


@router.patch("/users/{user_id}", response_model=UserOut, tags=["Users"])
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.USERS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    user = await service.update_user(context.institution_id, user_id, data)
    await session.commit()
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
async def deactivate_user(
    user_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.USERS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.deactivate_user(context.institution_id, user_id, context.user_id)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/students", response_model=Page[StudentOut], tags=["Students"])
async def list_students(
    pagination: PaginationParams = Depends(get_pagination),
    student_status: Optional[str] = Query(default=None, alias="status"),
    grade: Optional[int] = Query(default=None, ge=1, le=12),
    section: Optional[str] = Query(default=None, max_length=10),
    sort_by: str = Query(default="display_name"),
    context: AuthorizationContext = Depends(require_permission(Permissions.STUDENTS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    items, total = await service.list_students(
        context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        search=pagination.search,
        status=student_status,
        grade=grade,
        section=section,
        sort_by=sort_by,
        sort_order=pagination.sort_order,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=_pages(total, pagination.page_size),
    )


@router.post(
    "/students",
    response_model=StudentDetail,
    status_code=status.HTTP_201_CREATED,
    tags=["Students"],
)
async def create_student(
    data: StudentCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.STUDENTS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    student = await service.create_student(context.institution_id, data, context.user_id)
    await session.commit()
    return student


@router.get("/students/{student_id}", response_model=StudentDetail, tags=["Students"])
async def get_student(
    student_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.STUDENTS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    return await service.get_student(context.institution_id, student_id, detail=True)


@router.patch("/students/{student_id}", response_model=StudentDetail, tags=["Students"])
async def update_student(
    student_id: UUID,
    data: StudentUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.STUDENTS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    student = await service.update_student(context.institution_id, student_id, data)
    await session.commit()
    return student


@router.delete(
    "/students/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Students"],
)
async def deactivate_student(
    student_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.STUDENTS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.deactivate_student(context.institution_id, student_id)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/monitors", response_model=Page[MonitorOut], tags=["Monitors"])
async def list_monitors(
    pagination: PaginationParams = Depends(get_pagination),
    monitor_status: Optional[str] = Query(default=None, alias="status"),
    department: Optional[str] = Query(default=None, max_length=100),
    sort_by: str = Query(default="display_name"),
    context: AuthorizationContext = Depends(require_permission(Permissions.MONITORS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    items, total = await service.list_monitors(
        context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        search=pagination.search,
        status=monitor_status,
        department=department,
        sort_by=sort_by,
        sort_order=pagination.sort_order,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=_pages(total, pagination.page_size),
    )


@router.post(
    "/monitors",
    response_model=MonitorOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Monitors"],
)
async def create_monitor(
    data: MonitorCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.MONITORS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    monitor = await service.create_monitor(context.institution_id, data, context.user_id)
    await session.commit()
    return monitor


@router.get("/monitors/{monitor_id}", response_model=MonitorOut, tags=["Monitors"])
async def get_monitor(
    monitor_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.MONITORS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    return await service.get_monitor(context.institution_id, monitor_id)


@router.patch("/monitors/{monitor_id}", response_model=MonitorOut, tags=["Monitors"])
async def update_monitor(
    monitor_id: UUID,
    data: MonitorUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.MONITORS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    monitor = await service.update_monitor(context.institution_id, monitor_id, data)
    await session.commit()
    return monitor


@router.delete(
    "/monitors/{monitor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Monitors"],
)
async def deactivate_monitor(
    monitor_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.MONITORS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.deactivate_monitor(context.institution_id, monitor_id)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/memberships", response_model=Page[MembershipOut], tags=["Memberships"])
async def list_memberships(
    pagination: PaginationParams = Depends(get_pagination),
    user_id: Optional[UUID] = Query(default=None),
    role_code: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    context: AuthorizationContext = Depends(require_permission(Permissions.MEMBERSHIPS_READ_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
):
    items, total = await service.list_memberships(
        context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        user_id=user_id,
        role_code=role_code,
        is_active=is_active,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=_pages(total, pagination.page_size),
    )


@router.post(
    "/memberships",
    response_model=MembershipOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Memberships"],
)
async def create_membership(
    data: MembershipCreate,
    context: AuthorizationContext = Depends(require_permission(Permissions.MEMBERSHIPS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    membership = await service.create_membership(context.institution_id, data, context.user_id)
    await session.commit()
    return membership


@router.patch("/memberships/{membership_id}", response_model=MembershipOut, tags=["Memberships"])
async def update_membership(
    membership_id: UUID,
    data: MembershipUpdate,
    context: AuthorizationContext = Depends(require_permission(Permissions.MEMBERSHIPS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    membership = await service.update_membership(context.institution_id, membership_id, data)
    await session.commit()
    return membership


@router.delete(
    "/memberships/{membership_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Memberships"],
)
async def deactivate_membership(
    membership_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.MEMBERSHIPS_MANAGE_INSTITUTION)),
    service: PeopleService = Depends(get_people_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.deactivate_membership(context.institution_id, membership_id)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
