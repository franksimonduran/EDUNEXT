"""Educational game service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import EducationalGame, Course, Practice
from app.repositories import EducationalGameRepository
from app.schemas.practice import EducationalGameCreate, EducationalGameUpdate, GameType
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class EducationalGameService:
    """Educational game management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = EducationalGameRepository(session)

    async def list_games(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        practice_id: Optional[UUID] = None,
        game_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[EducationalGame], int]:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read games")
        
        return await self.repository.list_games(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            course_id=course_id,
            practice_id=practice_id,
            game_type=game_type,
            difficulty=difficulty,
            status=status,
            search=search,
        )

    async def get_game(self, context: AuthorizationContext, game_id: UUID) -> EducationalGame:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read games")
        return await self.repository.get_game(context.institution_id, game_id)

    async def get_game_detail(self, context: AuthorizationContext, game_id: UUID) -> EducationalGame:
        game = await self.get_game(context, game_id)
        stats = await self.repository.get_game_stats(game_id)
        game.session_count = stats["session_count"]
        return game

    async def create_game(
        self,
        context: AuthorizationContext,
        data: EducationalGameCreate,
    ) -> EducationalGame:
        if not has_permission(context, Permissions.CONTENT_CREATE):
            raise ForbiddenError("Insufficient permissions to create games")

        # Validate course if provided
        if data.course_id:
            course = await self.session.get(Course, str(data.course_id))
            if not course or course.institution_id != str(context.institution_id):
                raise NotFoundError("Course not found")

        # Validate practice if provided
        if data.practice_id:
            practice = await self.session.get(Practice, str(data.practice_id))
            if not practice or practice.institution_id != str(context.institution_id):
                raise NotFoundError("Practice not found")

        game_data = data.model_dump()
        game_data["institution_id"] = str(context.institution_id)
        game_data["created_by_user_id"] = str(context.user_id)
        
        game = await self.repository.create_game(game_data)
        await self.session.commit()
        return game

    async def update_game(
        self,
        context: AuthorizationContext,
        game_id: UUID,
        data: EducationalGameUpdate,
    ) -> EducationalGame:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to update games")

        game = await self.repository.get_game(context.institution_id, game_id)
        update_data = data.model_dump(exclude_unset=True)

        # Validate course if changing
        if "course_id" in update_data and update_data["course_id"]:
            course = await self.session.get(Course, str(update_data["course_id"]))
            if not course or course.institution_id != str(context.institution_id):
                raise NotFoundError("Course not found")

        # Validate practice if changing
        if "practice_id" in update_data and update_data["practice_id"]:
            practice = await self.session.get(Practice, str(update_data["practice_id"]))
            if not practice or practice.institution_id != str(context.institution_id):
                raise NotFoundError("Practice not found")

        protected_fields = ["id", "institution_id", "created_by_user_id", "created_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        game = await self.repository.update_game(game, update_data)
        await self.session.commit()
        return game

    async def delete_game(self, context: AuthorizationContext, game_id: UUID) -> None:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete games")

        game = await self.repository.get_game(context.institution_id, game_id)
        await self.repository.delete_game(game)
        await self.session.commit()

    async def get_student_games(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
    ) -> Tuple[List[EducationalGame], int]:
        """Get games available to the current student."""
        # Students can see published games for their enrolled courses
        # For now, return all published games in their institution
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            if not has_permission(context, Permissions.PROGRESS_READ_OWN):
                raise ForbiddenError("Insufficient permissions to read games")
        
        return await self.repository.list_games(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            course_id=course_id,
            status="published",
        )