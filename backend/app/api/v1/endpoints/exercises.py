"""Exercise endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_any_permission, require_permission
from app.dependencies.pagination import PaginationParams, get_pagination
from app.schemas.practice import (
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseRead,
    ExerciseDetail,
    ExerciseOptionCreate,
    ExerciseOptionRead,
)
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import pages
from app.services.exercise_service import ExerciseService

router = APIRouter(tags=["Exercises"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> ExerciseService:
    return ExerciseService(session)


@router.get("/practice-versions/{version_id}/exercises", response_model=Page[ExerciseRead])
async def list_exercises(
    version_id: UUID,
    pagination: PaginationParams = Depends(get_pagination),
    exercise_type: Optional[str] = Query(default=None),
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: ExerciseService = Depends(get_service),
):
    items, total = await service.list_exercises(
        context,
        version_id,
        page=pagination.page,
        page_size=pagination.page_size,
        exercise_type=exercise_type,
    )
    return Page(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages(total, pagination.page_size),
    )


@router.get("/exercises/{exercise_id}", response_model=ExerciseRead)
async def get_exercise(
    exercise_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: ExerciseService = Depends(get_service),
):
    return await service.get_exercise(context, exercise_id)


@router.get("/exercises/{exercise_id}/detail", response_model=ExerciseDetail)
async def get_exercise_detail(
    exercise_id: UUID,
    context: AuthorizationContext = Depends(
        require_any_permission(
            Permissions.CONTENT_READ,
            Permissions.COURSES_READ,
        )
    ),
    service: ExerciseService = Depends(get_service),
):
    return await service.get_exercise(context, exercise_id)


@router.post("/practice-versions/{version_id}/exercises", response_model=ExerciseDetail, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    version_id: UUID,
    data: ExerciseCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    exercise = await service.create_exercise(context, version_id, data)
    await session.commit()
    return exercise


@router.patch("/exercises/{exercise_id}", response_model=ExerciseDetail)
async def update_exercise(
    exercise_id: UUID,
    data: ExerciseUpdate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    exercise = await service.update_exercise(context, exercise_id, data)
    await session.commit()
    return exercise


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_exercise(context, exercise_id)
    await session.commit()


@router.post("/practice-versions/{version_id}/exercises/reorder", response_model=List[ExerciseRead])
async def reorder_exercises(
    version_id: UUID,
    exercise_ids: List[UUID],
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    exercises = await service.reorder_exercises(context, version_id, exercise_ids)
    await session.commit()
    return exercises


@router.post("/exercises/{exercise_id}/options", response_model=ExerciseOptionRead, status_code=status.HTTP_201_CREATED)
async def add_exercise_option(
    exercise_id: UUID,
    data: ExerciseOptionCreate,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    option = await service.add_option(context, exercise_id, data)
    await session.commit()
    return option


@router.patch("/exercise-options/{option_id}", response_model=ExerciseOptionRead)
async def update_exercise_option(
    option_id: UUID,
    data: dict,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    option = await service.update_option(context, option_id, data)
    await session.commit()
    return option


@router.delete("/exercise-options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise_option(
    option_id: UUID,
    context: AuthorizationContext = Depends(
        require_permission(Permissions.CONTENT_UPDATE)
    ),
    service: ExerciseService = Depends(get_service),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    await service.delete_option(context, option_id)
    await session.commit()