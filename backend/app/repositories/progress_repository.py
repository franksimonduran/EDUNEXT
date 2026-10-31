"""Progress queries scoped before aggregation; no writes to academic results."""

from datetime import datetime, timezone

from sqlalchemy import Date, String, and_, cast, func, literal, or_, select, union_all

from app.db.models import (
    AcademicYear, Classroom, ContentPublication, ContentReview, ContentVersion,
    Course, Enrollment, EnrollmentStatus, Institution, LearningProgress, Lesson,
    StudentProfile, TeacherAssignment, Unit,
)
from app.db.models.content_workflow import ContentPublicationStatus, ContentReviewStatus, ContentVisibility
from app.db.models.student_achievement import StudentAchievement

ORIGIN = "progress-engine-v1"


class ProgressRepository:
    def __init__(self, session):
        self.session = session

    async def courses(self, context, student_id, *, page=None, page_size=None):
        now = datetime.now(timezone.utc)
        query = (
            select(Course).join(Classroom, and_(Classroom.grade_id == Course.grade_id, Classroom.institution_id == Course.institution_id))
            .join(Enrollment, Enrollment.classroom_id == Classroom.id)
            .join(AcademicYear, Enrollment.academic_year_id == AcademicYear.id)
            .join(Institution, Course.institution_id == Institution.id)
            .where(
                Course.institution_id == str(context.institution_id), Course.status == "active",
                Enrollment.institution_id == str(context.institution_id), Enrollment.student_id == str(student_id),
                Enrollment.status == EnrollmentStatus.ACTIVE, Classroom.status == "active",
                AcademicYear.institution_id == str(context.institution_id), AcademicYear.status == "active",
                Classroom.academic_year_id == AcademicYear.id,
                AcademicYear.start_date <= cast(func.timezone(Institution.timezone, now), Date),
                AcademicYear.end_date >= cast(func.timezone(Institution.timezone, now), Date),
                or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= now),
                or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > now),
                select(TeacherAssignment.id).where(
                    TeacherAssignment.institution_id == str(context.institution_id),
                    TeacherAssignment.course_id == Course.id, TeacherAssignment.classroom_id == Classroom.id,
                    TeacherAssignment.status == "active",
                    or_(TeacherAssignment.start_date.is_(None), TeacherAssignment.start_date <= now),
                    or_(TeacherAssignment.end_date.is_(None), TeacherAssignment.end_date > now),
                ).correlate(Course, Classroom).exists(),
            ).distinct().order_by(Course.sequence, Course.id)
        )
        total = (await self.session.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one()
        if page is not None:
            query = query.offset((page - 1) * page_size).limit(page_size)
        return list((await self.session.execute(query)).scalars()), total

    async def catalog(self, institution_id, course_ids):
        if not course_ids:
            return []
        return list((await self.session.execute(self.catalog_statement(institution_id, course_ids))).all())

    def catalog_statement(self, institution_id, course_ids):
        query = (
            select(Lesson.id.label("lesson_id"), Lesson.unit_id, Unit.course_id,
                   ContentVersion.id.label("version_id"), ContentVersion.snapshot)
            .join(Unit, Lesson.unit_id == Unit.id)
            .join(ContentVersion, and_(ContentVersion.content_id == Lesson.id, ContentVersion.content_type == "lesson"))
            .join(ContentPublication, ContentPublication.content_version_id == ContentVersion.id)
            .join(ContentReview, and_(ContentReview.id == ContentPublication.review_id, ContentReview.content_version_id == ContentVersion.id))
            .where(
                Unit.course_id.in_([str(x) for x in course_ids]), Unit.status != "archived", Lesson.status == "published",
                ContentVersion.status == "published", ContentVersion.is_published.is_(True),
                ContentVersion.validation_result["is_valid"].as_boolean().is_(True),
                ContentPublication.status == ContentPublicationStatus.PUBLISHED,
                ContentPublication.institution_id == str(institution_id),
                ContentPublication.visibility == ContentVisibility.INSTITUTION,
                ContentReview.institution_id == str(institution_id),
                ContentReview.status == ContentReviewStatus.APPROVED,
                ContentReview.reviewer_user_id != ContentVersion.author_id,
            )
        )
        ranked = query.add_columns(
            func.row_number().over(partition_by=Lesson.id, order_by=(ContentVersion.version_number.desc(), ContentVersion.id)).label("version_rank"),
            Unit.sequence.label("unit_sequence"), Lesson.sequence.label("lesson_sequence"),
        ).subquery()
        query = select(ranked.c.lesson_id, ranked.c.unit_id, ranked.c.course_id, ranked.c.version_id, ranked.c.snapshot).where(
            ranked.c.version_rank == 1,
        ).order_by(ranked.c.course_id, ranked.c.unit_sequence, ranked.c.lesson_sequence, ranked.c.lesson_id)
        return query

    async def facts(self, institution_id, student_id):
        query = select(LearningProgress).where(
            LearningProgress.student_id == str(student_id),
            LearningProgress.metadata_["origin"].as_string() == ORIGIN,
            LearningProgress.metadata_["institution_id"].as_string() == str(institution_id),
        )
        return list((await self.session.execute(query)).scalars())

    async def awards(self, institution_id, student_id):
        return list((await self.session.execute(select(StudentAchievement).where(
            StudentAchievement.institution_id == str(institution_id), StudentAchievement.student_id == str(student_id),
        ).order_by(StudentAchievement.earned_at, StudentAchievement.id))).scalars())

    async def history(self, institution_id, student_id, *, page, page_size, course_id=None, event_type=None, since=None, until=None):
        facts = LearningProgress
        conditions = [facts.student_id == str(student_id),
                      facts.metadata_["origin"].as_string() == ORIGIN,
                      facts.metadata_["institution_id"].as_string() == str(institution_id)]
        if course_id:
            conditions.append(facts.metadata_["course_id"].as_string() == str(course_id))
        branches = []
        for kind, timestamp in [("lesson_started", facts.started_at), ("lesson_completed", facts.completed_at)]:
            filters = [*conditions, timestamp.is_not(None)]
            if event_type:
                filters.append(literal(kind) == event_type)
            if since:
                filters.append(timestamp >= since)
            if until:
                filters.append(timestamp <= until)
            branches.append(select(
                (cast(facts.id, String) + literal(":" + kind)).label("event_id"),
                facts.lesson_id, facts.metadata_["course_id"].as_string().label("course_id"),
                literal(kind).label("event_type"), timestamp.label("occurred_at"), timestamp.label("recorded_at"),
                func.coalesce(facts.metadata_["completed_enrollment_id"].as_string(), facts.metadata_["enrollment_id"].as_string()).label("enrollment_id") if kind == "lesson_completed" else facts.metadata_["enrollment_id"].as_string().label("enrollment_id"),
                func.coalesce(facts.metadata_["started_version_id"].as_string(), facts.metadata_["lesson_version_id"].as_string()).label("lesson_version_id") if kind == "lesson_started" else facts.metadata_["lesson_version_id"].as_string().label("lesson_version_id"),
            ).where(*filters))
        events = union_all(*branches).subquery()
        total = (await self.session.execute(select(func.count()).select_from(events))).scalar_one()
        rows = (await self.session.execute(select(events).order_by(
            events.c.occurred_at.desc(), events.c.event_id.desc(),
        ).offset((page - 1) * page_size).limit(page_size))).mappings().all()
        return rows, total
