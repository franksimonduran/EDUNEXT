"""Course service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Course, Grade, Subject
from app.repositories import CourseRepository, SubjectRepository
from app.schemas.content import CourseCreate, CourseUpdate
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class CourseService:
    """Course management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = CourseRepository(session)
        self.subject_repo = SubjectRepository(session)

    async def list_courses(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        grade_id: Optional[UUID] = None,
        subject_id: Optional[UUID] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Course], int]:
        can_read_institution = has_permission(context, Permissions.COURSES_READ)
        if not can_read_institution:
            raise ForbiddenError("Insufficient permissions to read courses")
        
        return await self.repository.list_courses(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            grade_id=grade_id,
            subject_id=subject_id,
            status=status,
            visibility=visibility,
            search=search,
        )

    async def get_course(self, context: AuthorizationContext, course_id: UUID) -> Course:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read courses")
        return await self.repository.get_course(context.institution_id, course_id)

    async def get_course_detail(self, context: AuthorizationContext, course_id: UUID) -> Course:
        course = await self.get_course(context, course_id)
        stats = await self.repository.get_course_stats(course_id)
        course.unit_count = stats["unit_count"]
        course.lesson_count = stats["lesson_count"]
        return course

    async def create_course(
        self,
        context: AuthorizationContext,
        data: CourseCreate,
    ) -> Course:
        if not has_permission(context, Permissions.COURSES_CREATE):
            raise ForbiddenError("Insufficient permissions to create courses")

        # Validate grade exists and is active
        grade = await self.session.get(Grade, str(data.grade_id))
        if not grade or grade.status != "active":
            raise NotFoundError("Grade not found or inactive")

        # Validate subject exists and is active
        subject = await self.subject_repo.get_subject(data.subject_id)
        if not subject or subject.status != "active":
            raise NotFoundError("Subject not found or inactive")

        # Check for duplicate code within institution and grade
        existing = await self.repository.get_course_by_code(
            context.institution_id, data.grade_id, data.code
        )
        if existing:
            raise ConflictError("A course with this code already exists for this grade")

        course_data = data.model_dump()
        course_data["institution_id"] = str(context.institution_id)
        course_data["created_by_user_id"] = str(context.user_id)
        
        course = await self.repository.create_course(course_data)
        await self.session.commit()
        return course

    async def update_course(
        self,
        context: AuthorizationContext,
        course_id: UUID,
        data: CourseUpdate,
    ) -> Course:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to update courses")

        course = await self.repository.get_course(context.institution_id, course_id)
        update_data = data.model_dump(exclude_unset=True)

        # Validate grade if changing
        if "grade_id" in update_data:
            grade = await self.session.get(Grade, str(update_data["grade_id"]))
            if not grade or grade.status != "active":
                raise NotFoundError("Grade not found or inactive")

        # Validate subject if changing
        if "subject_id" in update_data:
            subject = await self.subject_repo.get_subject(update_data["subject_id"])
            if not subject or subject.status != "active":
                raise NotFoundError("Subject not found or inactive")

        # Check for duplicate code if changing
        if "code" in update_data and update_data["code"] != course.code:
            existing = await self.repository.get_course_by_code(
                context.institution_id, course.grade_id, update_data["code"]
            )
            if existing:
                raise ConflictError("A course with this code already exists for this grade")

        # Prevent modifying certain fields
        protected_fields = ["id", "institution_id", "created_by_user_id", "created_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        course = await self.repository.update_course(course, update_data)
        await self.session.commit()
        return course

    async def archive_course(self, context: AuthorizationContext, course_id: UUID) -> Course:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to archive courses")

        course = await self.repository.get_course(context.institution_id, course_id)
        if course.status == "archived":
            return course
        
        course = await self.repository.update_course(course, {"status": "archived"})
        await self.session.commit()
        return course

    async def list_courses_for_monitor(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        grade_id: Optional[UUID] = None,
        subject_id: Optional[UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Course], int]:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read courses")
        
        return await self.repository.list_courses_for_monitor(
            institution_id=context.institution_id,
            monitor_user_id=context.user_id,
            page=page,
            page_size=page_size,
            grade_id=grade_id,
            subject_id=subject_id,
            status=status,
            search=search,
        )