"""Content manifest service."""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import ContentManifest, ContentPublication, ContentVersion, Lesson, Unit, Course, Resource
from app.repositories import ContentManifestRepository, ContentPublicationRepository, ContentVersionRepository, ResourceRepository
from app.schemas.content import ContentManifestCreate
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class ContentManifestService:
    """Content manifest management service for offline synchronization."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.manifest_repo = ContentManifestRepository(session)
        self.publication_repo = ContentPublicationRepository(session)
        self.version_repo = ContentVersionRepository(session)
        self.resource_repo = ResourceRepository(session)

    async def list_manifests(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        grade_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[ContentManifest], int]:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read content manifests")
        
        return await self.manifest_repo.list_manifests(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            course_id=course_id,
            grade_id=grade_id,
            is_active=is_active,
        )

    async def get_manifest(
        self,
        context: AuthorizationContext,
        manifest_id: UUID,
    ) -> ContentManifest:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read content manifests")
        
        return await self.manifest_repo.get_manifest(context.institution_id, manifest_id)

    async def generate_manifest(
        self,
        context: AuthorizationContext,
        data: ContentManifestCreate,
    ) -> ContentManifest:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to generate content manifests")

        # Verify course and grade
        course = await self.course_repo.get_course(context.institution_id, data.course_id)
        # Grade validation would go here

        # Get published versions for the course/grade
        from app.repositories import CourseRepository, UnitRepository, LessonRepository
        course_repo = CourseRepository(self.session)
        unit_repo = UnitRepository(self.session)
        lesson_repo = LessonRepository(self.session)

        # Get all units for the course
        units, _ = await unit_repo.list_units(course_id=data.course_id, page=1, page_size=1000)
        
        content_version_ids = []
        resource_ids = []
        checksums = {}
        required_resources = []
        total_size = 0

        for unit in units[0]:
            lessons, _ = await lesson_repo.list_lessons(unit_id=unit.id, page=1, page_size=1000)
            for lesson in lessons[0]:
                # Get published version of lesson
                pub_version = await self.version_repo.get_published_version(lesson.id, "lesson")
                if pub_version:
                    content_version_ids.append(str(pub_version.id))
                    # Add checksum
                    checksums[str(pub_version.id)] = self._calculate_checksum(pub_version.snapshot)
                    
                    # Get resources for this lesson
                    resources = await lesson_repo.get_lesson_resources(lesson.id)
                    for resource in resources:
                        if str(resource.id) not in resource_ids:
                            resource_ids.append(str(resource.id))
                            required_resources.append(str(resource.id))
                            if resource.file_size:
                                total_size += resource.file_size

        # Deactivate old manifests for this course/grade
        await self.manifest_repo.deactivate_manifests_for_course_grade(
            context.institution_id, data.course_id, data.grade_id
        )

        # Create manifest
        manifest_version = await self._get_next_manifest_version(context.institution_id, data.course_id, data.grade_id)
        
        manifest_data = data.model_dump()
        manifest_data.update({
            "institution_id": str(context.institution_id),
            "manifest_version": manifest_version,
            "content_version_ids": content_version_ids,
            "resource_ids": resource_ids,
            "checksums": checksums,
            "required_resources": required_resources,
            "total_size_bytes": total_size,
            "generated_at": datetime.utcnow(),
        })

        manifest = await self.manifest_repo.create_manifest(manifest_data)
        await self.session.commit()
        return manifest

    async def _get_next_manifest_version(self, institution_id: UUID, course_id: UUID, grade_id: UUID) -> int:
        latest = await self.manifest_repo.get_latest_manifest(institution_id, course_id, grade_id)
        if latest:
            return latest.manifest_version + 1
        return 1

    def _calculate_checksum(self, data: dict) -> str:
        import hashlib
        import json
        content = json.dumps(data, sort_keys=True).encode()
        return hashlib.sha256(content).hexdigest()

    async def verify_manifest_integrity(
        self,
        context: AuthorizationContext,
        manifest_id: UUID,
    ) -> dict:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to verify manifests")

        manifest = await self.manifest_repo.get_manifest(context.institution_id, manifest_id)
        
        results = {
            "manifest_id": str(manifest_id),
            "is_valid": True,
            "errors": [],
            "missing_versions": [],
            "missing_resources": [],
        }

        # Verify content versions exist
        for version_id in manifest.content_version_ids:
            version = await self.version_repo.get_version(UUID(version_id))
            if not version:
                results["missing_versions"].append(version_id)
                results["is_valid"] = False
            else:
                # Verify checksum
                expected = manifest.checksums.get(version_id)
                actual = self._calculate_checksum(version.snapshot)
                if expected != actual:
                    results["errors"].append(f"Checksum mismatch for version {version_id}")
                    results["is_valid"] = False

        # Verify resources exist
        for resource_id in manifest.resource_ids:
            try:
                await self.resource_repo.get_resource(context.institution_id, UUID(resource_id))
            except NotFoundError:
                results["missing_resources"].append(resource_id)
                results["is_valid"] = False

        return results

    async def get_student_manifests(
        self,
        context: AuthorizationContext,
        grade_id: UUID,
    ) -> List[ContentManifest]:
        """Get active manifests for a student's grade."""
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read manifests")

        # Get student's institution and enrolled courses
        # For now, return all active manifests for the grade in the institution
        manifests, _ = await self.manifest_repo.list_manifests(
            institution_id=context.institution_id,
            page=1,
            page_size=100,
            grade_id=grade_id,
            is_active=True,
        )
        return manifests