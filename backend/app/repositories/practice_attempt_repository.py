"""Practice attempt, response, result, and feedback repositories."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import PracticeAttempt, PracticeResponse, PracticeResult, PracticeFeedback, EducationalGame, GameSession, GameResult
from app.core.exceptions import NotFoundError


class PracticeAttemptRepository:
    """Repository for practice attempt operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_attempts(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        practice_id: Optional[UUID] = None,
        student_profile_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[PracticeAttempt], int]:
        conditions = [PracticeAttempt.institution_id == str(institution_id)]
        if practice_id:
            conditions.append(PracticeAttempt.practice_id == str(practice_id))
        if student_profile_id:
            conditions.append(PracticeAttempt.student_profile_id == str(student_profile_id))
        if status:
            conditions.append(PracticeAttempt.status == status)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(PracticeAttempt).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(PracticeAttempt)
            .where(*conditions)
            .options(
                selectinload(PracticeAttempt.practice),
                selectinload(PracticeAttempt.version),
                selectinload(PracticeAttempt.student_profile),
            )
            .order_by(PracticeAttempt.started_at.desc(), PracticeAttempt.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_attempt(self, institution_id: UUID, attempt_id: UUID) -> PracticeAttempt:
        stmt = (
            select(PracticeAttempt)
            .where(
                PracticeAttempt.id == str(attempt_id),
                PracticeAttempt.institution_id == str(institution_id),
            )
            .options(
                selectinload(PracticeAttempt.practice),
                selectinload(PracticeAttempt.version),
                selectinload(PracticeAttempt.student_profile),
                selectinload(PracticeAttempt.responses).selectinload(PracticeResponse.exercise),
            )
        )
        attempt = (await self.session.execute(stmt)).scalars().first()
        if not attempt:
            raise NotFoundError("Practice attempt not found")
        return attempt

    async def get_student_attempt(
        self, student_profile_id: UUID, version_id: UUID, attempt_number: int
    ) -> Optional[PracticeAttempt]:
        stmt = select(PracticeAttempt).where(
            PracticeAttempt.student_profile_id == str(student_profile_id),
            PracticeAttempt.version_id == str(version_id),
            PracticeAttempt.attempt_number == attempt_number,
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_attempt_count(self, student_profile_id: UUID, version_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(PracticeAttempt).where(
                PracticeAttempt.student_profile_id == str(student_profile_id),
                PracticeAttempt.version_id == str(version_id),
            )
        )
        return int(result.scalar_one())

    async def get_next_attempt_number(self, student_profile_id: UUID, version_id: UUID) -> int:
        result = await self.session.execute(
            select(func.coalesce(func.max(PracticeAttempt.attempt_number), 0)).where(
                PracticeAttempt.student_profile_id == str(student_profile_id),
                PracticeAttempt.version_id == str(version_id),
            )
        )
        return result.scalar_one() + 1

    async def create_attempt(self, data: dict) -> PracticeAttempt:
        attempt = PracticeAttempt(**data)
        self.session.add(attempt)
        await self.session.flush()
        await self.session.refresh(attempt)
        return attempt

    async def update_attempt(self, attempt: PracticeAttempt, data: dict) -> PracticeAttempt:
        for key, value in data.items():
            if value is not None:
                setattr(attempt, key, value)
        await self.session.flush()
        await self.session.refresh(attempt)
        return attempt

    async def delete_attempt(self, attempt: PracticeAttempt) -> None:
        await self.session.delete(attempt)
        await self.session.flush()


class PracticeResponseRepository:
    """Repository for practice response operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_response(self, attempt_id: UUID, exercise_id: UUID) -> Optional[PracticeResponse]:
        stmt = select(PracticeResponse).where(
            PracticeResponse.attempt_id == str(attempt_id),
            PracticeResponse.exercise_id == str(exercise_id),
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def list_responses(
        self,
        attempt_id: UUID,
    ) -> List[PracticeResponse]:
        stmt = (
            select(PracticeResponse)
            .where(PracticeResponse.attempt_id == str(attempt_id))
            .options(selectinload(PracticeResponse.exercise))
            .order_by(PracticeResponse.created_at.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def create_response(self, data: dict) -> PracticeResponse:
        response = PracticeResponse(**data)
        self.session.add(response)
        await self.session.flush()
        await self.session.refresh(response)
        return response

    async def update_response(self, response: PracticeResponse, data: dict) -> PracticeResponse:
        for key, value in data.items():
            if value is not None:
                setattr(response, key, value)
        await self.session.flush()
        await self.session.refresh(response)
        return response

    async def upsert_response(self, attempt_id: UUID, exercise_id: UUID, data: dict) -> PracticeResponse:
        existing = await self.get_response(attempt_id, exercise_id)
        if existing:
            return await self.update_response(existing, data)
        data["attempt_id"] = str(attempt_id)
        data["exercise_id"] = str(exercise_id)
        return await self.create_response(data)

    async def delete_response(self, response: PracticeResponse) -> None:
        await self.session.delete(response)
        await self.session.flush()


class PracticeResultRepository:
    """Repository for practice result operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_result(self, institution_id: UUID, result_id: UUID) -> PracticeResult:
        stmt = (
            select(PracticeResult)
            .where(
                PracticeResult.id == str(result_id),
                PracticeResult.institution_id == str(institution_id),
            )
            .options(
                selectinload(PracticeResult.attempt),
                selectinload(PracticeResult.practice),
                selectinload(PracticeResult.feedback_items),
            )
        )
        result = (await self.session.execute(stmt)).scalars().first()
        if not result:
            raise NotFoundError("Practice result not found")
        return result

    async def get_result_by_attempt(self, attempt_id: UUID) -> Optional[PracticeResult]:
        stmt = select(PracticeResult).where(PracticeResult.attempt_id == str(attempt_id))
        return (await self.session.execute(stmt)).scalars().first()

    async def list_results(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        practice_id: Optional[UUID] = None,
        student_profile_id: Optional[UUID] = None,
    ) -> Tuple[List[PracticeResult], int]:
        conditions = [PracticeResult.institution_id == str(institution_id)]
        if practice_id:
            conditions.append(PracticeResult.practice_id == str(practice_id))
        if student_profile_id:
            conditions.append(PracticeResult.student_profile_id == str(student_profile_id))

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(PracticeResult).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(PracticeResult)
            .where(*conditions)
            .options(
                selectinload(PracticeResult.practice),
                selectinload(PracticeResult.student_profile),
            )
            .order_by(PracticeResult.finalized_at.desc().nullslast(), PracticeResult.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def create_result(self, data: dict) -> PracticeResult:
        result = PracticeResult(**data)
        self.session.add(result)
        await self.session.flush()
        await self.session.refresh(result)
        return result

    async def update_result(self, result: PracticeResult, data: dict) -> PracticeResult:
        for key, value in data.items():
            if value is not None:
                setattr(result, key, value)
        await self.session.flush()
        await self.session.refresh(result)
        return result


class PracticeFeedbackRepository:
    """Repository for practice feedback operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_feedback(self, result_id: UUID) -> List[PracticeFeedback]:
        stmt = (
            select(PracticeFeedback)
            .where(PracticeFeedback.result_id == str(result_id))
            .order_by(PracticeFeedback.created_at.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def create_feedback(self, data: dict) -> PracticeFeedback:
        feedback = PracticeFeedback(**data)
        self.session.add(feedback)
        await self.session.flush()
        await self.session.refresh(feedback)
        return feedback

    async def bulk_create_feedback(self, feedback_list: List[dict]) -> List[PracticeFeedback]:
        feedback_items = [PracticeFeedback(**data) for data in feedback_list]
        self.session.add_all(feedback_items)
        await self.session.flush()
        for item in feedback_items:
            await self.session.refresh(item)
        return feedback_items