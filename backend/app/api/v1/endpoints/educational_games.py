"""Educational game endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.practice import (
    EducationalGameCreate,
    EducationalGameUpdate,
    EducationalGameRead,
    EducationalGameDetail,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.educational_game_service import EducationalGameService

router = APIRouter(tags=["Educational Games"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> EducationalGameService:
    return EducationalGameService(session)


@router.get("/educational-games", response_model=Page[EducationalGameRead])
async def list_games(
    pagination: PaginationParams = Depends(get_pagination),
    course_id: Optional[UUID] = Query(default=None),
    practice_id: Optional[UUID] = Query(default=None),
    game_type: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: EducationalGameService = Depends(get_service),
):
    items, total = await service.list_games(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        practice_id=practice_id,
        game_type=game_type,
        difficulty=difficulty,
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


@router.get("/educational-games/{game_id}", response_model=EducationalGameRead)
async def get_game(
    game_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: EducationalGameService = Depends(get_service),
):
    return await service.get_game(context, game_id)


@router.get("/educational-games/{game_id}/detail", response_model=EducationalGameDetail)
async def get_game_detail(
    game_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: EducationalGameService = Depends(get_service),
):
    return await service.get_game_detail(context, game_id)


@router.post("/educational-games", response_model=EducationalGameRead, status_code=status.HTTP_201_CREATED)
async def create_game(
    data: EducationalGameCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_CREATE)
    ),
    service: EducationalGameService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    game = await service.create_game(context, data)
    await session.commit()
    return game


@router.patch("/educational-games/{game_id}", response_model=EducationalGameRead)
async def update_game(
    game_id: UUID,
    data: EducationalGameUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: EducationalGameService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    game = await service.update_game(context, game_id, data)
    await session.commit()
    return game


@router.delete("/educational-games/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    game_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: EducationalGameService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_game(context, game_id)
    await session.commit()


@router.get("/courses/{course_id}/games", response_model=Page[EducationalGameRead])
async def list_course_games(
    course_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    game_type: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: EducationalGameService = Depends(get_service),
):
    items, total = await service.list_games(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
        game_type=game_type,
        difficulty=difficulty,
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


@router.get("/students/me/games", response_model=Page[EducationalGameRead])
async def get_student_games(
    pagination: PaginationParams = Depends(get_pagination),
    course_id: Optional[UUID] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.PROGRESS_READ_OWN,
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: EducationalGameService = Depends(get_service),
):
    items, total = await service.get_student_games(
        context,
        page=pagination.page,
        page_size=pagination.page_size,
        course_id=course_id,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )