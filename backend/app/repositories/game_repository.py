"""Educational game, session, and result repositories."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import EducationalGame, GameSession, GameResult
from app.core.exceptions import NotFoundError


class EducationalGameRepository:
    """Repository for educational game operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_games(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        practice_id: Optional[UUID] = None,
        game_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[EducationalGame], int]:
        conditions = [EducationalGame.institution_id == str(institution_id)]
        if course_id:
            conditions.append(EducationalGame.course_id == str(course_id))
        if practice_id:
            conditions.append(EducationalGame.practice_id == str(practice_id))
        if game_type:
            conditions.append(EducationalGame.game_type == game_type)
        if difficulty:
            conditions.append(EducationalGame.difficulty == difficulty)
        if status:
            conditions.append(EducationalGame.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(EducationalGame.title).like(pattern),
                    func.lower(EducationalGame.description).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(EducationalGame).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(EducationalGame)
            .where(*conditions)
            .options(
                selectinload(EducationalGame.course),
                selectinload(EducationalGame.practice),
            )
            .order_by(EducationalGame.created_at.desc(), EducationalGame.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_game(self, institution_id: UUID, game_id: UUID) -> EducationalGame:
        stmt = (
            select(EducationalGame)
            .where(
                EducationalGame.id == str(game_id),
                EducationalGame.institution_id == str(institution_id),
            )
            .options(
                selectinload(EducationalGame.course),
                selectinload(EducationalGame.practice),
            )
        )
        game = (await self.session.execute(stmt)).scalars().first()
        if not game:
            raise NotFoundError("Educational game not found")
        return game

    async def get_game_detail(self, institution_id: UUID, game_id: UUID) -> EducationalGame:
        stmt = (
            select(EducationalGame)
            .where(
                EducationalGame.id == str(game_id),
                EducationalGame.institution_id == str(institution_id),
            )
            .options(
                selectinload(EducationalGame.course),
                selectinload(EducationalGame.practice),
                selectinload(EducationalGame.sessions),
            )
        )
        game = (await self.session.execute(stmt)).scalars().first()
        if not game:
            raise NotFoundError("Educational game not found")
        return game

    async def create_game(self, data: dict) -> EducationalGame:
        game = EducationalGame(**data)
        self.session.add(game)
        await self.session.flush()
        await self.session.refresh(game)
        return game

    async def update_game(self, game: EducationalGame, data: dict) -> EducationalGame:
        for key, value in data.items():
            if value is not None:
                setattr(game, key, value)
        await self.session.flush()
        await self.session.refresh(game)
        return game

    async def delete_game(self, game: EducationalGame) -> None:
        await self.session.delete(game)
        await self.session.flush()

    async def get_game_stats(self, game_id: UUID) -> dict:
        session_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(GameSession).where(GameSession.game_id == str(game_id))
                )
            ).scalar_one()
        )
        return {"session_count": session_count}


class GameSessionRepository:
    """Repository for game session operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_sessions(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        game_id: Optional[UUID] = None,
        student_profile_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[GameSession], int]:
        conditions = [GameSession.institution_id == str(institution_id)]
        if game_id:
            conditions.append(GameSession.game_id == str(game_id))
        if student_profile_id:
            conditions.append(GameSession.student_profile_id == str(student_profile_id))
        if status:
            conditions.append(GameSession.status == status)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(GameSession).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(GameSession)
            .where(*conditions)
            .options(
                selectinload(GameSession.game),
                selectinload(GameSession.student_profile),
            )
            .order_by(GameSession.started_at.desc(), GameSession.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_session(self, institution_id: UUID, session_id: UUID) -> GameSession:
        stmt = (
            select(GameSession)
            .where(
                GameSession.id == str(session_id),
                GameSession.institution_id == str(institution_id),
            )
            .options(
                selectinload(GameSession.game),
                selectinload(GameSession.student_profile),
                selectinload(GameSession.results),
            )
        )
        session = (await self.session.execute(stmt)).scalars().first()
        if not session:
            raise NotFoundError("Game session not found")
        return session

    async def get_student_session(
        self, student_profile_id: UUID, game_id: UUID
    ) -> Optional[GameSession]:
        stmt = select(GameSession).where(
            GameSession.student_profile_id == str(student_profile_id),
            GameSession.game_id == str(game_id),
        ).order_by(GameSession.started_at.desc()).limit(1)
        return (await self.session.execute(stmt)).scalars().first()

    async def create_session(self, data: dict) -> GameSession:
        session = GameSession(**data)
        self.session.add(session)
        await self.session.flush()
        await self.session.refresh(session)
        return session

    async def update_session(self, session: GameSession, data: dict) -> GameSession:
        for key, value in data.items():
            if value is not None:
                setattr(session, key, value)
        await self.session.flush()
        await self.session.refresh(session)
        return session

    async def delete_session(self, session: GameSession) -> None:
        await self.session.delete(session)
        await self.session.flush()


class GameResultRepository:
    """Repository for game result operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_result(self, institution_id: UUID, result_id: UUID) -> GameResult:
        stmt = (
            select(GameResult)
            .where(
                GameResult.id == str(result_id),
                GameResult.institution_id == str(institution_id),
            )
            .options(
                selectinload(GameResult.session),
                selectinload(GameResult.game),
            )
        )
        result = (await self.session.execute(stmt)).scalars().first()
        if not result:
            raise NotFoundError("Game result not found")
        return result

    async def get_result_by_session(self, session_id: UUID) -> Optional[GameResult]:
        stmt = select(GameResult).where(GameResult.session_id == str(session_id))
        return (await self.session.execute(stmt)).scalars().first()

    async def list_results(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        game_id: Optional[UUID] = None,
        student_profile_id: Optional[UUID] = None,
    ) -> Tuple[List[GameResult], int]:
        conditions = [GameResult.institution_id == str(institution_id)]
        if game_id:
            conditions.append(GameResult.game_id == str(game_id))
        if student_profile_id:
            conditions.append(GameResult.student_profile_id == str(student_profile_id))

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(GameResult).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(GameResult)
            .where(*conditions)
            .options(
                selectinload(GameResult.game),
                selectinload(GameResult.student_profile),
            )
            .order_by(GameResult.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def create_result(self, data: dict) -> GameResult:
        result = GameResult(**data)
        self.session.add(result)
        await self.session.flush()
        await self.session.refresh(result)
        return result

    async def update_result(self, result: GameResult, data: dict) -> GameResult:
        for key, value in data.items():
            if value is not None:
                setattr(result, key, value)
        await self.session.flush()
        await self.session.refresh(result)
        return result