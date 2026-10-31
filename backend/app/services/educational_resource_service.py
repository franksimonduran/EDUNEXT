"""Educational resource service."""

import hashlib
import os
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Resource, Lesson, Unit, Course, ResourceStatus, ResourceType, LessonResource
from app.repositories import ResourceRepository, LessonRepository, UnitRepository, CourseRepository
from app.schemas.content import ResourceCreate, ResourceUpdate, LessonResourceCreate
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


# Allowed file types for upload
ALLOWED_MEDIA_TYPES = {
    ResourceType.IMAGE: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    ResourceType.AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"],
    ResourceType.VIDEO: ["video/mp4", "video/webm", "video/ogg"],
    ResourceType.DOCUMENT: ["application/pdf", "application/msword", 
                           "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ResourceType.ARCHIVE: ["application/zip", "application/x-tar", "application/gzip"],
    ResourceType.INTERACTIVE: ["application/json"],
    ResourceType.LINK: ["text/uri-list"],
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


class EducationalResourceService:
    """Educational resource management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = ResourceRepository(session)
        self.lesson_repo = LessonRepository(session)
        self.unit_repo = UnitRepository(session)
        self.course_repo = CourseRepository(session)

    async def list_resources(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        resource_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Resource], int]:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read resources")
        
        return await self.repository.list_resources(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            course_id=course_id,
            resource_type=resource_type,
            status=status,
            search=search,
        )

    async def get_resource(
        self,
        context: AuthorizationContext,
        resource_id: UUID,
    ) -> Resource:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read resources")
        
        return await self.repository.get_resource(context.institution_id, resource_id)

    async def get_resource_detail(
        self,
        context: AuthorizationContext,
        resource_id: UUID,
    ) -> Resource:
        resource = await self.get_resource(context, resource_id)
        usage = await self.repository.get_resource_usage(resource_id)
        resource.lesson_count = len(usage)
        resource.lessons = usage
        return resource

    async def create_resource(
        self,
        context: AuthorizationContext,
        data: ResourceCreate,
    ) -> Resource:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to create resources")

        # Validate course if provided
        if data.course_id:
            course = await self.course_repo.get_course(context.institution_id, data.course_id)
            if not course:
                raise NotFoundError("Course not found")

        resource_data = data.model_dump()
        resource_data["institution_id"] = str(context.institution_id)
        resource_data["author_id"] = str(context.user_id)
        
        resource = await self.repository.create_resource(resource_data)
        await self.session.commit()
        return resource

    async def update_resource(
        self,
        context: AuthorizationContext,
        resource_id: UUID,
        data: ResourceUpdate,
    ) -> Resource:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to update resources")

        resource = await self.repository.get_resource(context.institution_id, resource_id)
        update_data = data.model_dump(exclude_unset=True)

        # Validate course if changing
        if "course_id" in update_data and update_data["course_id"]:
            course = await self.course_repo.get_course(context.institution_id, update_data["course_id"])
            if not course:
                raise NotFoundError("Course not found")

        resource = await self.repository.update_resource(resource, update_data)
        await self.session.commit()
        return resource

    async def delete_resource(
        self,
        context: AuthorizationContext,
        resource_id: UUID,
    ) -> None:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete resources")

        resource = await self.repository.get_resource(context.institution_id, resource_id)
        
        # Check if resource is used in published content
        usage = await self.repository.get_resource_usage(resource_id)
        for usage_item in usage:
            # Would need to check if the lesson/unit/course is published
            pass  # TODO: Implement published content check

        await self.repository.delete_resource(resource)
        await self.session.commit()

    async def validate_and_process_upload(
        self,
        context: AuthorizationContext,
        file_data: bytes,
        filename: str,
        resource_type: ResourceType,
        media_type: str,
    ) -> dict:
        """Validate and process file upload."""
        # Check file size
        file_size = len(file_data)
        if file_size > MAX_FILE_SIZE:
            raise ValidationError(f"File size exceeds maximum allowed ({MAX_FILE_SIZE} bytes)")

        # Check media type
        allowed = ALLOWED_MEDIA_TYPES.get(resource_type, [])
        if media_type not in allowed:
            raise ValidationError(f"Media type '{media_type}' not allowed for resource type '{resource_type}'")

        # Calculate checksum
        checksum = hashlib.sha256(file_data).hexdigest()

        # Generate safe storage path
        safe_filename = self._generate_safe_filename(filename)
        storage_path = f"resources/{context.institution_id}/{safe_filename}"

        # TODO: Actually save file to storage (local/cloud)
        # For now, return metadata
        return {
            "storage_path": storage_path,
            "file_size": file_size,
            "checksum": checksum,
            "checksum_algorithm": "sha256",
        }

    def _generate_safe_filename(self, filename: str) -> str:
        """Generate a safe filename."""
        # Remove path components
        name = os.path.basename(filename)
        # Replace unsafe characters
        name = "".join(c if c.isalnum() or c in "._-" else "_" for c in name)
        # Add timestamp to prevent collisions
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        name, ext = os.path.splitext(name)
        return f"{name}_{timestamp}{ext}"

    async def associate_resource_with_lesson(
        self,
        context: AuthorizationContext,
        lesson_id: UUID,
        data: LessonResourceCreate,
    ) -> None:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to associate resources with lessons")

        lesson = await self.lesson_repo.get_lesson(lesson_id)
        unit = await self.unit_repo.get_unit(UUID(lesson.unit_id))
        await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
        resource = await self.repository.get_resource(context.institution_id, data.resource_id)
        
        # Verify resource belongs to same institution
        if resource.institution_id != str(context.institution_id):
            raise ForbiddenError("Cannot associate resource from another institution")

        # Check if already associated
        existing = await self.session.execute(
            select(LessonResource).where(
                LessonResource.lesson_id == str(lesson_id),
                LessonResource.resource_id == str(data.resource_id),
            )
        )
        if existing.scalars().first():
            raise ConflictError("Resource already associated with this lesson")

        lr = await self.lesson_repo.add_resource_to_lesson(
            lesson_id,
            data.resource_id,
            data.order,
            data.is_required,
            data.usage_context,
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

        lesson = await self.lesson_repo.get_lesson(lesson_id)
        unit = await self.unit_repo.get_unit(UUID(lesson.unit_id))
        await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
        await self.repository.get_resource(context.institution_id, resource_id)
        await self.lesson_repo.remove_resource_from_lesson(lesson_id, resource_id)
        await self.session.commit()
