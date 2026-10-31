"""Content version service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import ContentVersion, Lesson, Unit, Course
from app.repositories import ContentVersionRepository, LessonRepository, UnitRepository, CourseRepository
from app.schemas.content import ContentVersionCreate, ContentVersionStatus
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class ContentVersionService:
    """Content version management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = ContentVersionRepository(session)
        self.lesson_repo = LessonRepository(session)
        self.unit_repo = UnitRepository(session)
        self.course_repo = CourseRepository(session)

    async def _get_content_object(
        self,
        context: AuthorizationContext,
        content_type: str,
        content_id: UUID,
    ):
        if content_type == "lesson":
            lesson = await self.lesson_repo.get_lesson(content_id)
            unit = await self.unit_repo.get_unit(UUID(lesson.unit_id))
            course = await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
            return lesson
        elif content_type == "unit":
            unit = await self.unit_repo.get_unit(content_id)
            course = await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
            return unit
        elif content_type == "course":
            course = await self.course_repo.get_course(context.institution_id, content_id)
            return course
        else:
            raise ValidationError(f"Unknown content type: {content_type}")

    async def list_versions(
        self,
        context: AuthorizationContext,
        content_type: str,
        content_id: UUID,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
    ) -> Tuple[List[ContentVersion], int]:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read content versions")

        await self._get_content_object(context, content_type, content_id)
        
        return await self.repository.list_versions(
            content_id=content_id,
            content_type=content_type,
            page=page,
            page_size=page_size,
            status=status,
        )

    async def get_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
    ) -> ContentVersion:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read content versions")
        return await self.repository.get_version_with_relations(version_id)

    async def get_latest_version(
        self,
        context: AuthorizationContext,
        content_type: str,
        content_id: UUID,
    ) -> Optional[ContentVersion]:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read content versions")
        
        await self._get_content_object(context, content_type, content_id)
        return await self.repository.get_latest_version(content_id, content_type)

    async def get_published_version(
        self,
        context: AuthorizationContext,
        content_type: str,
        content_id: UUID,
    ) -> Optional[ContentVersion]:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read content versions")
        
        await self._get_content_object(context, content_type, content_id)
        return await self.repository.get_published_version(content_id, content_type)

    async def create_version(
        self,
        context: AuthorizationContext,
        content_type: str,
        content_id: UUID,
        data: ContentVersionCreate,
    ) -> ContentVersion:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to create content versions")

        content_obj = await self._get_content_object(context, content_type, content_id)
        
        # Verify the content is in a state that allows version creation
        if hasattr(content_obj, 'status') and content_obj.status == "archived":
            raise ConflictError("Cannot create versions for archived content")

        # Get next version number
        version_number = await self.repository.get_next_version_number(content_id, content_type)
        
        # Create snapshot from current content
        snapshot = await self._create_snapshot(content_type, content_obj)
        
        version_data = data.model_dump()
        version_data.update({
            "content_id": str(content_id),
            "content_type": content_type,
            "version_number": version_number,
            "snapshot": snapshot,
            "author_id": str(context.user_id),
        })
        
        # If no version string provided, generate one
        if not version_data.get("version"):
            version_data["version"] = f"{version_number}.0"

        version = await self.repository.create_version(version_data)
        await self.session.commit()
        return version

    async def update_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
        data: dict,
    ) -> ContentVersion:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to update content versions")

        version = await self.repository.get_version(version_id)
        
        # Only allow updating draft versions
        if version.status not in ["draft", "validation_failed"]:
            raise ConflictError("Can only update draft versions")

        update_data = {k: v for k, v in data.items() if v is not None}
        
        # Prevent modifying certain fields
        protected_fields = ["id", "content_id", "content_type", "version_number", "author_id", "created_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        version = await self.repository.update_version(version, update_data)
        await self.session.commit()
        return version

    async def delete_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
    ) -> None:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete content versions")

        version = await self.repository.get_version(version_id)
        
        # Prevent deleting published versions
        if version.is_published:
            raise ConflictError("Cannot delete a published version")

        await self.repository.delete_version(version)
        await self.session.commit()

    async def _create_snapshot(self, content_type: str, content_obj) -> dict:
        """Create a snapshot of the content object."""
        if content_type == "lesson":
            return {
                "id": str(content_obj.id),
                "title": content_obj.title,
                "description": content_obj.description,
                "objectives": content_obj.objectives,
                "sequence": content_obj.sequence,
                "duration_minutes": content_obj.duration_minutes,
                "estimated_time_minutes": content_obj.estimated_time_minutes,
                "difficulty_level": content_obj.difficulty_level,
                "status": content_obj.status,
                "blocks": content_obj.blocks,
                "tags": content_obj.tags,
                "keywords": content_obj.keywords,
                "learning_objectives": content_obj.learning_objectives,
                "prerequisites": content_obj.prerequisites,
            }
        elif content_type == "unit":
            return {
                "id": str(content_obj.id),
                "title": content_obj.title,
                "description": content_obj.description,
                "objectives": content_obj.objectives,
                "sequence": content_obj.sequence,
                "estimated_hours": content_obj.estimated_hours,
                "status": content_obj.status,
            }
        elif content_type == "course":
            return {
                "id": str(content_obj.id),
                "code": content_obj.code,
                "name": content_obj.name,
                "description": content_obj.description,
                "icon": content_obj.icon,
                "color": content_obj.color,
                "sequence": content_obj.sequence,
                "status": content_obj.status,
                "version": content_obj.version,
                "visibility": content_obj.visibility,
            }
        return {}