"""Minimal, paginated lesson tracking for a real assigned classroom/course."""

from datetime import datetime, timezone

from sqlalchemy import Date, cast, func, or_, select

from app.core.exceptions import NotFoundError
from app.db.models import AcademicYear, Classroom, Course, Enrollment, EnrollmentStatus, Institution, LearningProgress, StudentProfile, User, UserStatus
from app.repositories.progress_repository import ORIGIN, ProgressRepository
from app.schemas.permission import Permissions
from app.services.academic_access_service import AcademicAccessService
from app.services.progress_calculator import completion_percentage


class MonitorProgressService:
    def __init__(self, session):
        self.session = session

    async def students(self, context, classroom_id, course_id, *, page, page_size, period_id=None):
        assignment = await AcademicAccessService(self.session).require_teacher(
            context, course_id, classroom_id, Permissions.PROGRESS_READ_ASSIGNED,
        )
        if period_id is not None and str(assignment.period_id) != str(period_id):
            raise NotFoundError("No assignment in this period")
        now = datetime.now(timezone.utc)
        classroom = (await self.session.execute(select(Classroom).join(AcademicYear, Classroom.academic_year_id == AcademicYear.id).join(
            Course, Course.grade_id == Classroom.grade_id,
        ).join(Institution, Institution.id == Classroom.institution_id).where(Classroom.id == str(classroom_id), Classroom.institution_id == str(context.institution_id),
                 Classroom.status == "active", AcademicYear.status == "active",
                 AcademicYear.institution_id == str(context.institution_id),
                 AcademicYear.start_date <= cast(func.timezone(Institution.timezone, now), Date),
                 AcademicYear.end_date >= cast(func.timezone(Institution.timezone, now), Date),
                 Course.id == str(course_id), Course.institution_id == str(context.institution_id), Course.status == "active"))).scalars().first()
        if classroom is None:
            raise NotFoundError("Classroom course not available")
        base = select(StudentProfile.id).join(User, StudentProfile.user_id == User.id).join(
            Enrollment, Enrollment.student_id == StudentProfile.id,
        ).where(
            User.status == UserStatus.ACTIVE, User.institution_id == str(context.institution_id),
            Enrollment.institution_id == str(context.institution_id), Enrollment.classroom_id == str(classroom_id),
            Enrollment.academic_year_id == classroom.academic_year_id, Enrollment.status == EnrollmentStatus.ACTIVE,
            or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= now),
            or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > now),
        ).distinct()
        total = (await self.session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        students = list((await self.session.execute(base.order_by(StudentProfile.id).offset((page-1)*page_size).limit(page_size))).scalars())
        catalog = await ProgressRepository(self.session).catalog(context.institution_id, [course_id])
        lesson_ids = [row.lesson_id for row in catalog]
        counts = dict((await self.session.execute(select(LearningProgress.student_id, func.count(func.distinct(LearningProgress.lesson_id))).where(
            LearningProgress.student_id.in_(students), LearningProgress.lesson_id.in_(lesson_ids),
            LearningProgress.status == "completed", LearningProgress.metadata_["origin"].as_string() == ORIGIN,
            LearningProgress.metadata_["institution_id"].as_string() == str(context.institution_id),
        ).group_by(LearningProgress.student_id))).all()) if students and lesson_ids else {}
        return [{"student_id": student, "course_id": str(course_id), "applicable_lessons_count": len(lesson_ids),
                 "completed_lessons_count": counts.get(student, 0),
                 "completion_percentage": completion_percentage(counts.get(student, 0), len(lesson_ids)),
                 "source": "calculated_from_server_records"} for student in students], total
