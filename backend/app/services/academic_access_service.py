"""Fail-closed authorization shared by attempts and future assessment workflows."""

from sqlalchemy import select

from app.core.exceptions import ForbiddenError
from app.db.models import StudentProfile, User, UserStatus
from app.repositories.academic_access_repository import course_enrollment_query, teacher_access_query


class AcademicAccessService:
    def __init__(self, session):
        self.session = session

    async def student(self, context):
        query = select(StudentProfile).join(User, StudentProfile.user_id == User.id).where(
            User.id == str(context.user_id),
            User.institution_id == str(context.institution_id),
            User.status == UserStatus.ACTIVE,
        )
        student = (await self.session.execute(query)).scalars().first()
        if student is None:
            raise ForbiddenError("An active student profile in this institution is required")
        return student

    async def require_owner(self, context, attempt):
        student = await self.student(context)
        if (
            str(attempt.institution_id) != str(context.institution_id)
            or str(attempt.student_profile_id) != str(student.id)
        ):
            raise ForbiddenError("Attempt does not belong to this student")
        return student

    async def enrollment(self, context, course_id):
        enrollment = (await self.session.execute(course_enrollment_query(
            context.institution_id, context.user_id, course_id,
        ))).scalars().first()
        if enrollment is None:
            raise ForbiddenError("An active enrollment and authorized course offering are required")
        return enrollment

    async def require_teacher(self, context, course_id, classroom_id, permission):
        if permission not in context.permissions:
            raise ForbiddenError("Insufficient permissions")
        assignment = (await self.session.execute(teacher_access_query(
            context, course_id, classroom_id,
        ))).scalars().first()
        if assignment is None:
            raise ForbiddenError("An active teacher assignment is required")
        return assignment
