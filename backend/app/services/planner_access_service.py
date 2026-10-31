"""Planner authorizations tied to real course, classroom, period and enrollment."""

from zoneinfo import ZoneInfo

from sqlalchemy import or_, select

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.planner_rules import now_utc, permission
from app.db.models import AcademicPeriod, AcademicYear, Classroom, Course, Enrollment, EnrollmentStatus, Institution, MonitorProfile, StudentProfile, TeacherAssignment, User, UserStatus
from app.repositories.academic_access_repository import teacher_access_query
from app.services.academic_access_service import AcademicAccessService


class PlannerAccessService:
    def __init__(self, session):
        self.session = session

    async def teacher(self, context, course_id, classroom_id, period_id, code):
        permission(context, code)
        query = teacher_access_query(context, course_id, classroom_id).where(or_(TeacherAssignment.period_id.is_(None), TeacherAssignment.period_id == str(period_id)))
        assignment = (await self.session.execute(query)).scalars().first()
        if assignment is None:
            raise ForbiddenError("No active assignment for this classroom/course/period")
        return assignment

    async def academic_context(self, context, course_id, classroom_id, period_id, available, due):
        row = (await self.session.execute(select(Course, Classroom, AcademicPeriod, AcademicYear, Institution).join(
            Classroom, Classroom.grade_id == Course.grade_id,
        ).join(AcademicYear, Classroom.academic_year_id == AcademicYear.id).join(
            AcademicPeriod, AcademicPeriod.academic_year_id == AcademicYear.id,
        ).join(Institution, Course.institution_id == Institution.id).where(
            Course.id == str(course_id), Course.institution_id == str(context.institution_id), Course.status == "active",
            Classroom.id == str(classroom_id), Classroom.institution_id == str(context.institution_id), Classroom.status == "active",
            AcademicPeriod.id == str(period_id), AcademicPeriod.status.in_(["planned", "active"]),
            AcademicYear.institution_id == str(context.institution_id), AcademicYear.status.in_(["planned", "active"]),
        ))).first()
        if row is None:
            raise NotFoundError("Academic context not available")
        course, classroom, period, year, institution = row
        zone = ZoneInfo(institution.timezone)
        if available > due or available.astimezone(zone).date() < period.start_date or due.astimezone(zone).date() > period.end_date:
            raise ValidationError("Availability and deadline must fit the selected academic period")
        return row

    async def enrolled(self, context, classroom_id, year_id, *, student_ids=None):
        now = now_utc()
        query = select(Enrollment).join(StudentProfile, Enrollment.student_id == StudentProfile.id).join(User, StudentProfile.user_id == User.id).where(
            Enrollment.institution_id == str(context.institution_id), Enrollment.classroom_id == str(classroom_id),
            Enrollment.academic_year_id == str(year_id), Enrollment.status == EnrollmentStatus.ACTIVE,
            User.status == UserStatus.ACTIVE, User.institution_id == str(context.institution_id),
            or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= now),
            or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > now),
        )
        if student_ids is not None:
            query = query.where(Enrollment.student_id.in_([str(x) for x in student_ids]))
        return list((await self.session.execute(query.order_by(Enrollment.student_id))).scalars())

    async def student(self, context, code):
        permission(context, code)
        return await AcademicAccessService(self.session).student(context)

    async def teaching_contexts(self, context, *, page, page_size, permission_code="assignments.create_assigned"):
        from sqlalchemy import func
        permission(context, permission_code)
        now = now_utc()
        query = select(Course.id.label("course_id"), Course.name.label("course_title"),
            Classroom.id.label("classroom_id"), Classroom.display_name.label("classroom_title"),
            AcademicPeriod.id.label("academic_period_id"), AcademicPeriod.name.label("period_title"),
            AcademicPeriod.start_date, AcademicPeriod.end_date, Institution.timezone).select_from(TeacherAssignment).join(
                MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id,
            ).join(User, MonitorProfile.user_id == User.id).join(Course, TeacherAssignment.course_id == Course.id).join(
                Classroom, TeacherAssignment.classroom_id == Classroom.id,
            ).join(AcademicYear, Classroom.academic_year_id == AcademicYear.id).join(
                AcademicPeriod, AcademicPeriod.academic_year_id == AcademicYear.id,
            ).join(Institution, Classroom.institution_id == Institution.id).where(
                User.id == str(context.user_id), User.institution_id == str(context.institution_id), User.status == UserStatus.ACTIVE,
                TeacherAssignment.institution_id == str(context.institution_id), TeacherAssignment.status == "active",
                Course.institution_id == str(context.institution_id), Course.status == "active", Course.grade_id == Classroom.grade_id,
                Classroom.institution_id == str(context.institution_id), Classroom.status == "active",
                AcademicYear.institution_id == str(context.institution_id), AcademicYear.status.in_(["active", "planned"]),
                AcademicPeriod.status.in_(["active", "planned"]),
                or_(TeacherAssignment.period_id.is_(None), TeacherAssignment.period_id == AcademicPeriod.id),
                or_(TeacherAssignment.start_date.is_(None), TeacherAssignment.start_date <= now),
                or_(TeacherAssignment.end_date.is_(None), TeacherAssignment.end_date > now),
            ).distinct()
        total = (await self.session.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        rows = (await self.session.execute(query.order_by(Classroom.id, Course.id, AcademicPeriod.id).offset((page-1)*page_size).limit(page_size))).mappings().all()
        return {"items": [dict(row) for row in rows], "total": total, "page": page, "page_size": page_size}
