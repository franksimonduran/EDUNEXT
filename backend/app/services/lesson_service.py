"""Lesson service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Lesson, Unit, Resource, LessonResource
from app.repositories import LessonRepository, UnitRepository, ResourceRepository, CourseRepository
from app.schemas.content import LessonCreate, LessonUpdate, LessonBlock
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class LessonService:
    """Lesson management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = LessonRepository(session)
        self.unit_repo = UnitRepository(session)
        self.resource_repo = ResourceRepository(session)
        self.course_repo = CourseRepository(session)

    async def _course_for_unit(self, context: AuthorizationContext, unit_id: UUID):
        unit = await self.unit_repo.get_unit(unit_id)
        return await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))

    async def list_lessons(
        self,
        context: AuthorizationContext,
        unit_id: UUID,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Lesson], int]:
        await self._course_for_unit(context, unit_id)
        
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read lessons")
        
        return await self.repository.list_lessons(
            unit_id=unit_id,
            page=page,
            page_size=page_size,
            status=status,
            search=search,
        )

    async def get_lesson(self, context: AuthorizationContext, lesson_id: UUID) -> Lesson:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read lessons")
        lesson = await self.repository.get_lesson(lesson_id)
        await self._course_for_unit(context, UUID(lesson.unit_id))
        return lesson

    async def get_lesson_detail(self, context: AuthorizationContext, lesson_id: UUID) -> Lesson:
        lesson = await self.get_lesson(context, lesson_id)
        resources = await self.repository.get_lesson_resources(lesson_id)
        lesson.resource_count = len(resources)
        return lesson

    async def create_lesson(
        self,
        context: AuthorizationContext,
        unit_id: UUID,
        data: LessonCreate,
    ) -> Lesson:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to create lessons")

        course = await self._course_for_unit(context, unit_id)
        
        if course.status in ["archived"]:
            raise ConflictError("Cannot add lessons to an archived course")

        # Check for duplicate sequence
        existing_lessons = await self.repository.list_lessons(
            unit_id=unit_id,
            page=1,
            page_size=1000,
        )
        for lesson in existing_lessons[0]:
            if lesson.sequence == data.sequence:
                raise ConflictError("A lesson with this sequence already exists in the unit")

        # Validate blocks if provided
        if data.blocks:
            await self._validate_blocks(data.blocks)

        lesson_data = data.model_dump()
        lesson_data["unit_id"] = str(unit_id)
        lesson_data["created_by_user_id"] = str(context.user_id)
        
        lesson = await self.repository.create_lesson(lesson_data)
        await self.session.commit()
        return lesson

    async def update_lesson(
        self,
        context: AuthorizationContext,
        lesson_id: UUID,
        data: LessonUpdate,
    ) -> Lesson:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to update lessons")

        lesson = await self.repository.get_lesson(lesson_id)
        course = await self._course_for_unit(context, UUID(lesson.unit_id))
        
        if course.status in ["archived"]:
            raise ConflictError("Cannot modify lessons in an archived course")

        update_data = data.model_dump(exclude_unset=True)

        # Validate blocks if provided
        if "blocks" in update_data and update_data["blocks"] is not None:
            await self._validate_blocks(update_data["blocks"])

        # Check for duplicate sequence if changing
        if "sequence" in update_data:
            existing_lessons = await self.repository.list_lessons(
                unit_id=UUID(lesson.unit_id),
                page=1,
                page_size=1000,
            )
            for l in existing_lessons[0]:
                if l.id != lesson_id and l.sequence == update_data["sequence"]:
                    raise ConflictError("A lesson with this sequence already exists in the unit")

        # Prevent modifying certain fields
        protected_fields = ["id", "unit_id", "created_by_user_id", "created_at", "version"]
        for field in protected_fields:
            update_data.pop(field, None)

        lesson = await self.repository.update_lesson(lesson, update_data)
        await self.session.commit()
        return lesson

    async def delete_lesson(self, context: AuthorizationContext, lesson_id: UUID) -> None:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete lessons")

        lesson = await self.repository.get_lesson(lesson_id)
        course = await self._course_for_unit(context, UUID(lesson.unit_id))
        
        if course.status in ["archived"]:
            raise ConflictError("Cannot delete lessons from an archived course")

        await self.repository.delete_lesson(lesson)
        await self.session.commit()

    async def reorder_lessons(
        self,
        context: AuthorizationContext,
        unit_id: UUID,
        lesson_ids: List[UUID],
    ) -> List[Lesson]:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to reorder lessons")

        course = await self._course_for_unit(context, unit_id)
        
        if course.status in ["archived"]:
            raise ConflictError("Cannot reorder lessons in an archived course")

        lessons = await self.repository.reorder_lessons(unit_id, lesson_ids)
        await self.session.commit()
        return lessons

    async def add_resource_to_lesson(
        self,
        context: AuthorizationContext,
        lesson_id: UUID,
        resource_id: UUID,
        order: int = 0,
        is_required: bool = False,
        usage_context: Optional[str] = None,
    ) -> LessonResource:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to add resources to lessons")

        lesson = await self.repository.get_lesson(lesson_id)
        await self._course_for_unit(context, UUID(lesson.unit_id))
        resource = await self.resource_repo.get_resource(context.institution_id, resource_id)
        
        # Verify resource belongs to the same institution
        if resource.institution_id != str(context.institution_id):
            raise ForbiddenError("Cannot associate resource from another institution")

        lr = await self.repository.add_resource_to_lesson(
            lesson_id, resource_id, order, is_required, usage_context
        )
        await self.session.commit()
        return lr

    async def remove_resource_from_lesson(
        self,
        context: AuthorizationContext,
        lesson_id: UUID,
        resource_id: UUID,
    ) -> None:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to remove resources from lessons")

        lesson = await self.repository.get_lesson(lesson_id)
        await self._course_for_unit(context, UUID(lesson.unit_id))
        await self.resource_repo.get_resource(context.institution_id, resource_id)
        await self.repository.remove_resource_from_lesson(lesson_id, resource_id)
        await self.session.commit()

    async def _validate_blocks(self, blocks: List[LessonBlock]) -> None:
        """Validate lesson blocks structure and content."""
        from app.services.content_validation_service import ContentValidationService
        validator = ContentValidationService(self.session)
        result = await validator.validate_lesson_blocks(blocks)
        if not result.is_valid:
            raise ValidationError(f"Invalid lesson blocks: {', '.join(result.errors)}")
