"""Game session endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.practice import (
    GameSessionCreate,
    GameSessionRead,
    GameSessionDetail,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.game_session_service import GameSessionService

router = APIRouter(tags=["Game Sessions"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> GameSessionService:
    return GameSessionService(session)


@router.get("/game-sessions", response_model=Page[GameSessionRead])
async def list_sessions(
    pagination: PaginationParams = Depends(get_pagination),
    game_id: Optional[UUID] = Query(default=None),
    student_profile_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: GameSessionService = Depends(get_service),
):
    items, total = await service.list_sessions(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        game_id=game_id,
        student_profile_id=student_profile_id,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/game-sessions/{session_id}", response_model=GameSessionRead)
async def get_session(
    session_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: GameSessionService = Depends(get_service),
):
    return await service.get_session(context, session_id)


@router.get("/game-sessions/{session_id}/detail", response_model=GameSessionDetail)
async def get_session_detail(
    session_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: GameSessionService = Depends(get_service),
):
    return await service.get_session(context, session_id)


@router.post("/educational-games/{game_id}/sessions", response_model=GameSessionDetail, status_code=status.HTTP_201_CREATED)
async def start_session(
    game_id: UUID,
    data: GameSessionCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: GameSessionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    data.game_id = game_id
    session = await service.start_session(context, data)
    await session.commit()
    return session


@router.patch("/game-sessions/{session_id}", response_model=GameSessionRead)
async def update_session(
    session_id: UUID,
    session_data: dict,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: GameSessionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    session = await service.update_session(context, session_id, session_data)
    await session.commit()
    return session


@router.post("/game-sessions/{session_id}/finish", response_model=GameSessionDetail)
async def finish_session(
    session_id: UUID,
    result_data: dict,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: GameSessionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    session = await service.finish_session(context, session_id, result_data)
    await session.commit()
    return session


@router.post("/game-sessions/{session_id}/abandon", response_model=GameSessionRead)
async def abandon_session(
    session_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: GameSessionService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    session = await service.abandon_session(context, session_id)
    await session.commit()
    return session


@router.get("/educational-games/{game_id}/sessions", response_model=Page[GameSessionRead])
async def list_game_sessions(
    game_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    student_profile_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
            Permissions.PROGRESS_READ_OWN,
        )
    ),
    service: GameSessionService = Depends(get_service),
):
    items, total = await service.list_sessions(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        game_id=game_id,
        student_profile_id=student_profile_id,
        status=status,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/students/me/game-sessions", response_model=Page[GameSessionRead])
async def get_my_sessions(
    pagination: PaginationParams = Depends(get_pagination),
    context: AuthorizationContext = Depends(
        require_permission(Permissions.PROGRESS_READ_OWN)
    ),
    service: GameSessionService = Depends(get_service),
):
    # Get student profile
    from app.db.models import StudentProfile
    from sqlalchemy import select
    student_profile = await service.session.execute(
        select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
    )
    student_profile = student_profile.scalars().first()
    if not student_profile:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Student profile not found")

    items, total = await service.session_repo.list_sessions(
        institution_id=context.institution_id,
        page=pagination.page,
        page_size=pagination.page_size,
        student_profile_id=student_profile.id,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )