"""Practice service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Course, Practice, Unit, Lesson
from app.repositories import PracticeRepository, PracticeVersionRepository
from app.schemas.practice import PracticeCreate, PracticeUpdate, PracticeStatus
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class PracticeService:
    """Practice management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = PracticeRepository(session)
        self.version_repo = PracticeVersionRepository(session)

    async def list_practices(
        self,
        context: AuthorizationContext,
        *,
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
        can_read = has_permission(context, Permissions.CONTENT_READ) or has_permission(context, Permissions.COURSES_READ)
        if not can_read:
            raise ForbiddenError("Insufficient permissions to read practices")
        
        return await self.repository.list_practices(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            course_id=course_id,
            unit_id=unit_id,
            lesson_id=lesson_id,
            practice_type=practice_type,
            difficulty=difficulty,
            status=status,
            search=search,
        )

    async def get_practice(self, context: AuthorizationContext, practice_id: UUID) -> Practice:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read practices")
        return await self.repository.get_practice(context.institution_id, practice_id)

    async def get_practice_detail(self, context: AuthorizationContext, practice_id: UUID) -> Practice:
        practice = await self.get_practice(context, practice_id)
        stats = await self.repository.get_practice_stats(practice_id)
        practice.version_count = stats["version_count"]
        practice.exercise_count = stats["exercise_count"]
        practice.attempt_count = stats["attempt_count"]
        return practice

    async def create_practice(
        self,
        context: AuthorizationContext,
        data: PracticeCreate,
    ) -> Practice:
        if not has_permission(context, Permissions.CONTENT_CREATE):
            raise ForbiddenError("Insufficient permissions to create practices")

        # Validate course exists and is accessible
        course = await self.session.get(Course, str(data.course_id))
        if not course or course.institution_id != str(context.institution_id):
            raise NotFoundError("Course not found")
        if course.status == "archived":
            raise ConflictError("Cannot create practices in an archived course")

        # Validate unit if provided
        if data.unit_id:
            unit = await self.session.get(Unit, str(data.unit_id))
            if not unit or unit.course_id != str(data.course_id):
                raise ValidationError("Unit does not belong to the specified course")

        # Validate lesson if provided
        if data.lesson_id:
            lesson = await self.session.get(Lesson, str(data.lesson_id))
            if not lesson or lesson.unit_id != str(data.unit_id):
                raise ValidationError("Lesson does not belong to the specified unit")

        practice_data = data.model_dump()
        practice_data["institution_id"] = str(context.institution_id)
        practice_data["created_by_user_id"] = str(context.user_id)
        
        practice = await self.repository.create_practice(practice_data)
        await self.session.commit()
        return practice

    async def update_practice(
        self,
        context: AuthorizationContext,
        practice_id: UUID,
        data: PracticeUpdate,
    ) -> Practice:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to update practices")

        practice = await self.repository.get_practice(context.institution_id, practice_id)
        update_data = data.model_dump(exclude_unset=True)

        # Validate course if changing
        if "course_id" in update_data:
            course = await self.session.get(Course, str(update_data["course_id"]))
            if not course or course.institution_id != str(context.institution_id):
                raise NotFoundError("Course not found")

        # Validate unit if changing
        if "unit_id" in update_data and update_data["unit_id"]:
            unit = await self.session.get(Unit, str(update_data["unit_id"]))
            if not unit or unit.course_id != str(practice.course_id):
                raise ValidationError("Unit does not belong to the practice's course")

        # Validate lesson if changing
        if "lesson_id" in update_data and update_data["lesson_id"]:
            lesson = await self.session.get(Lesson, str(update_data["lesson_id"]))
            if not lesson or lesson.unit_id != str(practice.unit_id):
                raise ValidationError("Lesson does not belong to the practice's unit")

        # Prevent modifying certain fields
        protected_fields = ["id", "institution_id", "created_by_user_id", "created_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        practice = await self.repository.update_practice(practice, update_data)
        await self.session.commit()
        return practice

    async def archive_practice(self, context: AuthorizationContext, practice_id: UUID) -> Practice:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to archive practices")

        practice = await self.repository.get_practice(context.institution_id, practice_id)
        if practice.status == PracticeStatus.ARCHIVED:
            return practice
        
        practice = await self.repository.update_practice(practice, {"status": PracticeStatus.ARCHIVED})
        await self.session.commit()
        return practice

    async def submit_for_review(
        self,
        context: AuthorizationContext,
        practice_id: UUID,
    ) -> Practice:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to submit for review")

        practice = await self.repository.get_practice(context.institution_id, practice_id)
        
        if practice.status != PracticeStatus.DRAFT:
            raise ValidationError("Only draft practices can be submitted for review")

        # Check if practice has exercises
        from app.repositories import ExerciseRepository
        exercise_repo = ExerciseRepository(self.session)
        exercises, _ = await exercise_repo.list_exercises(version_id=practice_id, page=1, page_size=1)
        if not exercises:
            raise ValidationError("Practice must have at least one exercise")

        practice = await self.repository.update_practice(practice, {"status": PracticeStatus.READY_FOR_REVIEW})
        await self.session.commit()
        return practice