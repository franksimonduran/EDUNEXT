"""Game session service."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import EducationalGame, GameSession, GameResult, StudentProfile, Enrollment
from app.repositories import EducationalGameRepository, GameSessionRepository, GameResultRepository
from app.schemas.practice import GameSessionCreate, GameSessionStatus
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class GameSessionService:
    """Game session management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.game_repo = EducationalGameRepository(session)
        self.session_repo = GameSessionRepository(session)
        self.result_repo = GameResultRepository(session)

    async def list_sessions(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        game_id: Optional[UUID] = None,
        student_profile_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[GameSession], int]:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            if not has_permission(context, Permissions.PROGRESS_READ_OWN):
                raise ForbiddenError("Insufficient permissions to read game sessions")
        
        # Students can only see their own sessions
        if has_permission(context, Permissions.PROGRESS_READ_OWN) and not has_permission(context, Permissions.CONTENT_READ):
            student_profile = await self.session.execute(
                select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
            )
            student_profile = student_profile.scalars().first()
            if student_profile:
                student_profile_id = student_profile.id
        
        return await self.session_repo.list_sessions(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            game_id=game_id,
            student_profile_id=student_profile_id,
            status=status,
        )

    async def get_session(self, context: AuthorizationContext, session_id: UUID) -> GameSession:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            if not has_permission(context, Permissions.PROGRESS_READ_OWN):
                raise ForbiddenError("Insufficient permissions to read game sessions")
        
        session = await self.session_repo.get_session(context.institution_id, session_id)
        
        # Check ownership for students
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(session.student_profile_id) != str(student_profile.id):
            if not has_permission(context, Permissions.CONTENT_READ):
                raise ForbiddenError("Cannot access another student's session")
        
        return session

    async def start_session(
        self,
        context: AuthorizationContext,
        data: GameSessionCreate,
    ) -> GameSession:
        if not has_permission(context, Permissions.PROGRESS_READ_OWN):
            raise ForbiddenError("Insufficient permissions to start game sessions")

        # Get student profile
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if not student_profile:
            raise NotFoundError("Student profile not found")

        game = await self.game_repo.get_game(context.institution_id, data.game_id)
        
        # Check if game is published
        if game.status != "published":
            raise ConflictError("Can only play published games")

        # Create session
        session_data = {
            "game_id": str(game.id),
            "student_profile_id": str(student_profile.id),
            "institution_id": str(context.institution_id),
            "status": GameSessionStatus.IN_PROGRESS,
            "session_data": {},
            "configuration_snapshot": game.configuration,
            "total_objectives": game.configuration.get("total_objectives", 10),
        }

        session = await self.session_repo.create_session(session_data)
        await self.session.commit()
        return session

    async def update_session(
        self,
        context: AuthorizationContext,
        session_id: UUID,
        session_data: dict,
    ) -> GameSession:
        session = await self.session_repo.get_session(context.institution_id, session_id)
        
        # Verify ownership
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(session.student_profile_id) != str(student_profile.id):
            raise ForbiddenError("Cannot update another student's session")

        if session.status != GameSessionStatus.IN_PROGRESS:
            raise ConflictError("Can only update in-progress sessions")

        session.session_data = session_data
        await self.session.flush()
        await self.session.refresh(session)
        await self.session.commit()
        return session

    async def finish_session(
        self,
        context: AuthorizationContext,
        session_id: UUID,
        result_data: dict,
    ) -> GameSession:
        session = await self.session_repo.get_session(context.institution_id, session_id)
        
        # Verify ownership
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(session.student_profile_id) != str(student_profile.id):
            raise ForbiddenError("Cannot finish another student's session")

        if session.status != GameSessionStatus.IN_PROGRESS:
            raise ConflictError("Can only finish in-progress sessions")

        # Update session
        session.status = GameSessionStatus.COMPLETED
        session.finished_at = datetime.now(timezone.utc)
        session.session_data = result_data
        
        # Calculate score from result data
        score = result_data.get("score", 0)
        max_score = result_data.get("max_score", 0)
        objectives_completed = result_data.get("objectives_completed", 0)
        attempts_count = result_data.get("attempts_count", 0)
        time_spent = result_data.get("time_spent_seconds", 0)
        
        session.score = score
        session.max_score = max_score
        session.objectives_completed = objectives_completed
        session.attempts_count = attempts_count
        session.time_spent_seconds = time_spent

        # Create result
        result_data_full = {
            "session_id": str(session_id),
            "student_profile_id": str(session.student_profile_id),
            "game_id": str(session.game_id),
            "institution_id": str(session.institution_id),
            "score": score,
            "max_score": max_score,
            "objectives_completed": objectives_completed,
            "total_objectives": session.total_objectives,
            "completed": True,
            "result_data": result_data,
        }
        
        await self.result_repo.create_result(result_data_full)
        await self.session.commit()
        return session

    async def abandon_session(
        self,
        context: AuthorizationContext,
        session_id: UUID,
    ) -> GameSession:
        session = await self.session_repo.get_session(context.institution_id, session_id)
        
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(session.student_profile_id) != str(student_profile.id):
            raise ForbiddenError("Cannot abandon another student's session")

        if session.status != GameSessionStatus.IN_PROGRESS:
            raise ConflictError("Can only abandon in-progress sessions")

        session.status = GameSessionStatus.ABANDONED
        session.finished_at = datetime.now(timezone.utc)
        await self.session.commit()
        return session