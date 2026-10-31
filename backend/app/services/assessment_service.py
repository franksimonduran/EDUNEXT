"""Assessment service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Assessment, Course, Unit
from app.repositories.assessment_repository import AssessmentRepository
from app.schemas.assessment import AssessmentCreate, AssessmentUpdate, AssessmentStatusEnum as AssessmentStatus
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class AssessmentService:
    """Assessment management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = AssessmentRepository(session)

    async def list_assessments(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        unit_id: Optional[UUID] = None,
        assessment_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Assessment], int]:
        can_read = has_permission(context, Permissions.CONTENT_READ) or has_permission(context, Permissions.COURSES_READ)
        if not can_read:
            raise ForbiddenError("Insufficient permissions to read assessments")

        return await self.repository.list_assessments(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            course_id=course_id,
            unit_id=unit_id,
            assessment_type=assessment_type,
            status=status,
            search=search,
        )

    async def get_assessment(self, context: AuthorizationContext, assessment_id: UUID) -> Assessment:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read assessments")
        return await self.repository.get_assessment(context.institution_id, assessment_id)

    async def get_assessment_detail(self, context: AuthorizationContext, assessment_id: UUID) -> Assessment:
        assessment = await self.get_assessment(context, assessment_id)
        stats = await self.repository.get_assessment_stats(assessment_id)
        assessment.questions_count = stats["questions_count"]
        assessment.attempts_count = stats["attempts_count"]
        return assessment

    async def create_assessment(
        self,
        context: AuthorizationContext,
        data: AssessmentCreate,
    ) -> Assessment:
        if not has_permission(context, Permissions.CONTENT_CREATE):
            raise ForbiddenError("Insufficient permissions to create assessments")

        course = await self.session.get(Course, str(data.course_id))
        if not course or course.institution_id != str(context.institution_id):
            raise NotFoundError("Course not found")
        if course.status == "archived":
            raise ConflictError("Cannot create assessments in an archived course")

        if data.unit_id:
            unit = await self.session.get(Unit, str(data.unit_id))
            if not unit or unit.course_id != str(data.course_id):
                raise ValidationError("Unit does not belong to the specified course")

        assessment_data = data.model_dump()
        assessment = await self.repository.create_assessment(assessment_data)
        await self.session.flush()
        return assessment

    async def update_assessment(
        self,
        context: AuthorizationContext,
        assessment_id: UUID,
        data: AssessmentUpdate,
    ) -> Assessment:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to update assessments")

        assessment = await self.repository.get_assessment(context.institution_id, assessment_id)
        update_data = data.model_dump(exclude_unset=True)

        if "course_id" in update_data:
            course = await self.session.get(Course, str(update_data["course_id"]))
            if not course or course.institution_id != str(context.institution_id):
                raise NotFoundError("Course not found")

        if "unit_id" in update_data and update_data["unit_id"]:
            unit = await self.session.get(Unit, str(update_data["unit_id"]))
            if not unit or unit.course_id != str(assessment.course_id):
                raise ValidationError("Unit does not belong to the assessment's course")

        protected_fields = ["id", "created_at", "updated_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        assessment = await self.repository.update_assessment(assessment, update_data)
        await self.session.flush()
        return assessment

    async def publish_assessment(
        self,
        context: AuthorizationContext,
        assessment_id: UUID,
    ) -> Assessment:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to publish assessments")

        assessment = await self.repository.get_assessment(context.institution_id, assessment_id)

        if assessment.status == AssessmentStatus.PUBLISHED:
            return assessment

        questions_count = await self.repository.get_questions_count(assessment_id)
        if questions_count == 0:
            raise ValidationError("Assessment must have at least one question to be published")

        assessment = await self.repository.update_assessment(
            assessment,
            {"status": AssessmentStatus.PUBLISHED},
        )
        await self.session.flush()
        return assessment

    async def archive_assessment(
        self,
        context: AuthorizationContext,
        assessment_id: UUID,
    ) -> Assessment:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to archive assessments")

        assessment = await self.repository.get_assessment(context.institution_id, assessment_id)
        if assessment.status == AssessmentStatus.ARCHIVED:
            return assessment

        assessment = await self.repository.update_assessment(
            assessment,
            {"status": AssessmentStatus.ARCHIVED},
        )
        await self.session.flush()
        return assessment
