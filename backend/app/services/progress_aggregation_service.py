"""Small-cohort-suppressed institutional counts, never individual grade data."""

from datetime import datetime, timezone

from sqlalchemy import Date, cast, func, or_, select

from app.core.exceptions import ForbiddenError
from app.db.models import AcademicYear, Enrollment, EnrollmentStatus, Institution, LearningProgress, StudentProfile, User, UserStatus
from app.repositories.progress_repository import ORIGIN
from app.schemas.permission import Permissions


class ProgressAggregationService:
    def __init__(self, session):
        self.session = session

    async def summary(self, context):
        if Permissions.PROGRESS_READ_INSTITUTION_AGGREGATES not in context.permissions:
            raise ForbiddenError("Institution aggregate permission required")
        now = datetime.now(timezone.utc)
        population = select(Enrollment.student_id).join(StudentProfile, Enrollment.student_id == StudentProfile.id).join(
            User, StudentProfile.user_id == User.id,
        ).join(AcademicYear, Enrollment.academic_year_id == AcademicYear.id).join(
            Institution, Enrollment.institution_id == Institution.id,
        ).where(
            User.status == UserStatus.ACTIVE, User.institution_id == str(context.institution_id),
            Enrollment.institution_id == str(context.institution_id), Enrollment.status == EnrollmentStatus.ACTIVE,
            AcademicYear.institution_id == str(context.institution_id), AcademicYear.status == "active",
            AcademicYear.start_date <= cast(func.timezone(Institution.timezone, now), Date),
            AcademicYear.end_date >= cast(func.timezone(Institution.timezone, now), Date),
            or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= now),
            or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > now),
        ).distinct()
        count = (await self.session.execute(select(func.count()).select_from(population.subquery()))).scalar_one()
        if count < 5:
            return {"data_status": "suppressed_small_cohort", "minimum_population": 5,
                    "enrolled_students_count": None, "recorded_lesson_completions_count": None}
        completed = (await self.session.execute(select(func.count()).select_from(LearningProgress).where(
            LearningProgress.student_id.in_(population), LearningProgress.status == "completed",
            LearningProgress.metadata_["origin"].as_string() == ORIGIN,
            LearningProgress.metadata_["institution_id"].as_string() == str(context.institution_id),
        ))).scalar_one()
        return {"data_status": "calculated_from_server_records", "minimum_population": 5,
                "enrolled_students_count": count, "recorded_lesson_completions_count": completed,
                "definition": "Historical self-declared lesson completions of currently enrolled students; not current-catalog mastery"}
