"""Practice repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Practice, PracticeVersion, Exercise, PracticeAttempt, PracticeResponse, PracticeResult, PracticeFeedback, EducationalGame, GameSession, GameResult
from app.core.exceptions import NotFoundError


class PracticeRepository:
    """Repository for practice operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_practices(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        unit_id: Optional[UUID] = None,
        lesson_id: Optional[UUID] = None,
        practice_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Practice], int]:
        conditions = [Practice.institution_id == str(institution_id)]
        if course_id:
            conditions.append(Practice.course_id == str(course_id))
        if unit_id:
            conditions.append(Practice.unit_id == str(unit_id))
        if lesson_id:
            conditions.append(Practice.lesson_id == str(lesson_id))
        if practice_type:
            conditions.append(Practice.practice_type == practice_type)
        if difficulty:
            conditions.append(Practice.difficulty == difficulty)
        if status:
            conditions.append(Practice.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Practice.title).like(pattern),
                    func.lower(Practice.description).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Practice).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Practice)
            .where(*conditions)
            .options(
                selectinload(Practice.course),
                selectinload(Practice.unit),
                selectinload(Practice.lesson),
                selectinload(Practice.versions),
            )
            .order_by(Practice.created_at.desc(), Practice.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_practice(self, institution_id: UUID, practice_id: UUID) -> Practice:
        stmt = (
            select(Practice)
            .where(
                Practice.id == str(practice_id),
                Practice.institution_id == str(institution_id),
            )
            .options(
                selectinload(Practice.course),
                selectinload(Practice.unit),
                selectinload(Practice.lesson),
                selectinload(Practice.versions),
            )
        )
        practice = (await self.session.execute(stmt)).scalars().first()
        if not practice:
            raise NotFoundError("Practice not found")
        return practice

    async def get_practice_detail(self, institution_id: UUID, practice_id: UUID) -> Practice:
        stmt = (
            select(Practice)
            .where(
                Practice.id == str(practice_id),
                Practice.institution_id == str(institution_id),
            )
            .options(
                selectinload(Practice.course),
                selectinload(Practice.unit),
                selectinload(Practice.lesson),
                selectinload(Practice.versions),
                selectinload(Practice.exercises),
            )
        )
        practice = (await self.session.execute(stmt)).scalars().first()
        if not practice:
            raise NotFoundError("Practice not found")
        return practice

    async def create_practice(self, data: dict) -> Practice:
        practice = Practice(**data)
        self.session.add(practice)
        await self.session.flush()
        await self.session.refresh(practice)
        return practice

    async def update_practice(self, practice: Practice, data: dict) -> Practice:
        for key, value in data.items():
            if value is not None:
                setattr(practice, key, value)
        await self.session.flush()
        await self.session.refresh(practice)
        return practice

    async def delete_practice(self, practice: Practice) -> None:
        await self.session.delete(practice)
        await self.session.flush()

    async def get_practice_stats(self, practice_id: UUID) -> dict:
        version_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(PracticeVersion).where(PracticeVersion.practice_id == str(practice_id))
                )
            ).scalar_one()
        )
        exercise_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Exercise).where(Exercise.practice_id == str(practice_id))
                )
            ).scalar_one()
        )
        attempt_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(PracticeAttempt).where(PracticeAttempt.practice_id == str(practice_id))
                )
            ).scalar_one()
        )
        return {
            "version_count": version_count,
            "exercise_count": exercise_count,
            "attempt_count": attempt_count,
        }


class PracticeVersionRepository:
    """Repository for practice version operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_versions(
        self,
        *,
        practice_id: UUID,
        page: int,
        page_size: int,
        status: Optional[str] = None,
    ) -> Tuple[List[PracticeVersion], int]:
        conditions = [PracticeVersion.practice_id == str(practice_id)]
        if status:
            conditions.append(PracticeVersion.status == status)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(PracticeVersion).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(PracticeVersion)
            .where(*conditions)
            .order_by(PracticeVersion.version_number.desc(), PracticeVersion.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_version(self, version_id: UUID) -> PracticeVersion:
        stmt = select(PracticeVersion).where(PracticeVersion.id == str(version_id))
        version = (await self.session.execute(stmt)).scalars().first()
        if not version:
            raise NotFoundError("Practice version not found")
        return version

    async def get_version_with_relations(self, version_id: UUID) -> PracticeVersion:
        stmt = (
            select(PracticeVersion)
            .where(PracticeVersion.id == str(version_id))
            .options(
                selectinload(PracticeVersion.practice),
                selectinload(PracticeVersion.exercises),
            )
        )
        version = (await self.session.execute(stmt)).scalars().first()
        if not version:
            raise NotFoundError("Practice version not found")
        return version

    async def get_latest_version(self, practice_id: UUID) -> Optional[PracticeVersion]:
        stmt = (
            select(PracticeVersion)
            .where(PracticeVersion.practice_id == str(practice_id))
            .order_by(PracticeVersion.version_number.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_published_version(self, practice_id: UUID) -> Optional[PracticeVersion]:
        stmt = (
            select(PracticeVersion)
            .where(
                PracticeVersion.practice_id == str(practice_id),
                PracticeVersion.status == "published",
            )
            .order_by(PracticeVersion.version_number.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_next_version_number(self, practice_id: UUID) -> int:
        result = await self.session.execute(
            select(func.coalesce(func.max(PracticeVersion.version_number), 0)).where(
                PracticeVersion.practice_id == str(practice_id)
            )
        )
        return result.scalar_one() + 1

    async def create_version(self, data: dict) -> PracticeVersion:
        version = PracticeVersion(**data)
        self.session.add(version)
        await self.session.flush()
        await self.session.refresh(version)
        return version

    async def update_version(self, version: PracticeVersion, data: dict) -> PracticeVersion:
        for key, value in data.items():
            if value is not None:
                setattr(version, key, value)
        await self.session.flush()
        await self.session.refresh(version)
        return version


class ExerciseRepository:
    """Repository for exercise operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_exercises(
        self,
        *,
        version_id: UUID,
        page: int,
        page_size: int,
        exercise_type: Optional[str] = None,
    ) -> Tuple[List[Exercise], int]:
        conditions = [Exercise.version_id == str(version_id)]
        if exercise_type:
            conditions.append(Exercise.exercise_type == exercise_type)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Exercise).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Exercise)
            .where(*conditions)
            .options(selectinload(Exercise.options))
            .order_by(Exercise.sequence.asc(), Exercise.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_exercise(self, exercise_id: UUID) -> Exercise:
        stmt = select(Exercise).where(Exercise.id == str(exercise_id))
        exercise = (await self.session.execute(stmt)).scalars().first()
        if not exercise:
            raise NotFoundError("Exercise not found")
        return exercise

    async def get_exercise_with_options(self, exercise_id: UUID) -> Exercise:
        stmt = (
            select(Exercise)
            .where(Exercise.id == str(exercise_id))
            .options(selectinload(Exercise.options))
        )
        exercise = (await self.session.execute(stmt)).scalars().first()
        if not exercise:
            raise NotFoundError("Exercise not found")
        return exercise

    async def create_exercise(self, data: dict) -> Exercise:
        exercise = Exercise(**data)
        self.session.add(exercise)
        await self.session.flush()
        await self.session.refresh(exercise)
        return exercise

    async def update_exercise(self, exercise: Exercise, data: dict) -> Exercise:
        for key, value in data.items():
            if value is not None:
                setattr(exercise, key, value)
        await self.session.flush()
        await self.session.refresh(exercise)
        return exercise

    async def delete_exercise(self, exercise: Exercise) -> None:
        await self.session.delete(exercise)
        await self.session.flush()

    async def reorder_exercises(self, version_id: UUID, exercise_ids: List[UUID]) -> List[Exercise]:
        for index, exercise_id in enumerate(exercise_ids):
            exercise = await self.get_exercise(exercise_id)
            if exercise.version_id != str(version_id):
                from app.core.exceptions import ValidationError
                raise ValidationError(f"Exercise {exercise_id} does not belong to version {version_id}")
            exercise.sequence = index
        await self.session.flush()
        stmt = select(Exercise).where(Exercise.version_id == str(version_id)).order_by(Exercise.sequence.asc())
        return list((await self.session.execute(stmt)).scalars().all())


class ExerciseOptionRepository:
    """Repository for exercise option operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_option(self, option_id: UUID):
        from app.db.models import ExerciseOption
        stmt = select(ExerciseOption).where(ExerciseOption.id == str(option_id))
        return (await self.session.execute(stmt)).scalars().first()

    async def create_option(self, data: dict):
        from app.db.models import ExerciseOption
        option = ExerciseOption(**data)
        self.session.add(option)
        await self.session.flush()
        await self.session.refresh(option)
        return option

    async def update_option(self, option, data: dict):
        for key, value in data.items():
            if value is not None:
                setattr(option, key, value)
        await self.session.flush()
        await self.session.refresh(option)
        return option

    async def delete_option(self, option):
        await self.session.delete(option)
        await self.session.flush()