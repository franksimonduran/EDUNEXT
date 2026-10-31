"""Queries for course access through real academic relationships."""

from datetime import datetime, timezone

from sqlalchemy import Date, and_, cast, func, or_, select

from app.db.models import (
    AcademicYear, Classroom, Course, Enrollment, EnrollmentStatus,
    Institution, MonitorProfile, StudentProfile, TeacherAssignment, User, UserStatus,
)


def course_enrollment_query(institution_id, user_id, course_id, *, at=None):
    """A grade alone is insufficient: require an active course offering in the classroom."""
    at = at or datetime.now(timezone.utc)
    return (
        select(Enrollment)
        .join(StudentProfile, Enrollment.student_id == StudentProfile.id)
        .join(User, StudentProfile.user_id == User.id)
        .join(Institution, User.institution_id == Institution.id)
        .join(Classroom, Enrollment.classroom_id == Classroom.id)
        .join(AcademicYear, Enrollment.academic_year_id == AcademicYear.id)
        .join(Course, and_(
            Course.institution_id == Classroom.institution_id,
            Course.grade_id == Classroom.grade_id,
        ))
        .where(
            User.id == str(user_id), User.status == UserStatus.ACTIVE,
            User.institution_id == str(institution_id),
            Enrollment.institution_id == str(institution_id),
            Classroom.institution_id == str(institution_id),
            AcademicYear.institution_id == str(institution_id),
            Classroom.academic_year_id == AcademicYear.id,
            Course.id == str(course_id), Course.status == "active",
            Enrollment.status == EnrollmentStatus.ACTIVE,
            Classroom.status == "active", AcademicYear.status == "active",
            AcademicYear.start_date <= cast(func.timezone(Institution.timezone, at), Date),
            AcademicYear.end_date >= cast(func.timezone(Institution.timezone, at), Date),
            or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= at),
            or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > at),
            select(TeacherAssignment.id).where(
                TeacherAssignment.institution_id == str(institution_id),
                TeacherAssignment.course_id == Course.id,
                TeacherAssignment.classroom_id == Classroom.id,
                TeacherAssignment.status == "active",
                or_(TeacherAssignment.start_date.is_(None), TeacherAssignment.start_date <= at),
                or_(TeacherAssignment.end_date.is_(None), TeacherAssignment.end_date > at),
            ).correlate(Course, Classroom).exists(),
        )
        .order_by(Enrollment.id)
        .limit(1)
    )


def teacher_access_query(context, course_id, classroom_id, *, at=None):
    at = at or datetime.now(timezone.utc)
    return (
        select(TeacherAssignment)
        .join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id)
        .join(User, MonitorProfile.user_id == User.id)
        .join(Classroom, TeacherAssignment.classroom_id == Classroom.id)
        .join(Course, TeacherAssignment.course_id == Course.id)
        .where(
            User.id == str(context.user_id), User.status == UserStatus.ACTIVE,
            User.institution_id == str(context.institution_id),
            TeacherAssignment.institution_id == str(context.institution_id),
            Course.institution_id == str(context.institution_id),
            Classroom.institution_id == str(context.institution_id),
            TeacherAssignment.course_id == str(course_id),
            TeacherAssignment.classroom_id == str(classroom_id),
            TeacherAssignment.status == "active",
            or_(TeacherAssignment.start_date.is_(None), TeacherAssignment.start_date <= at),
            or_(TeacherAssignment.end_date.is_(None), TeacherAssignment.end_date > at),
        )
        .limit(1)
    )
