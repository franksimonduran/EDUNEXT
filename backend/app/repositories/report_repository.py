"""Bounded SQL aggregations; institutional scope is applied before grouping."""

from sqlalchemy import func, or_, select

from app.db.models import AcademicYear, Assignment, AssignmentTarget, Classroom, Course, Enrollment, EnrollmentStatus, Grade, LearningProgress
from app.db.models.assignment import AssignmentStatus
from app.db.models.planner import AssignmentSubmission, AssignmentVersion
from app.repositories.planner_repository import teacher_scope
from app.core import planner_rules
from app.repositories.progress_repository import ProgressRepository, ORIGIN


class ReportRepository:
    def __init__(self, session):
        self.session = session

    def enrollment_scope(self, institution_id, cutoff, local_date, year_id=None):
        effective = func.coalesce(Enrollment.effective_date, Enrollment.enrolled_at)
        conditions = [Enrollment.institution_id == str(institution_id),
            Classroom.institution_id == str(institution_id), AcademicYear.institution_id == str(institution_id),
            Classroom.academic_year_id == Enrollment.academic_year_id,
            AcademicYear.start_date <= local_date, AcademicYear.end_date >= local_date,
            Enrollment.status.notin_([EnrollmentStatus.PENDING, EnrollmentStatus.CANCELLED])]
        if year_id:
            conditions.append(Enrollment.academic_year_id == str(year_id))
        base = select(Enrollment.student_id, Grade.number.label("grade"), effective.label("effective"), Enrollment.id,
            Enrollment.status, Enrollment.ended_at).join(Classroom, Enrollment.classroom_id == Classroom.id).join(
            AcademicYear, Enrollment.academic_year_id == AcademicYear.id).join(Grade, Classroom.grade_id == Grade.id).where(*conditions)
        return base, effective

    async def enrollments(self, institution_id, cutoff, local_date, year_id=None):
        base, effective = self.enrollment_scope(institution_id, cutoff, local_date, year_id)
        incomplete = (await self.session.execute(select(func.count()).select_from(base.where(
            effective <= cutoff, Enrollment.status != EnrollmentStatus.ACTIVE, Enrollment.ended_at.is_(None),
        ).subquery()))).scalar_one()
        candidates = base.where(effective <= cutoff,
            or_(Enrollment.ended_at > cutoff,
                (Enrollment.ended_at.is_(None) & (Enrollment.status == EnrollmentStatus.ACTIVE))))
        ranked = candidates.add_columns(func.row_number().over(partition_by=Enrollment.student_id,
            order_by=(effective.desc(), Enrollment.id)).label("n")).subquery()
        distinct_people = select(ranked.c.student_id, ranked.c.grade).where(ranked.c.n == 1).subquery()
        groups = (await self.session.execute(select(distinct_people.c.grade,
            func.count().label("unique_students_count")).group_by(distinct_people.c.grade).order_by(distinct_people.c.grade))).mappings().all()
        return [dict(row) for row in groups], incomplete

    async def institution_counts(self, institution_id):
        scope = str(institution_id)
        course_count = (await self.session.execute(select(func.count()).select_from(Course).where(
            Course.institution_id == scope, Course.status == "active"))).scalar_one()
        task_count = (await self.session.execute(select(func.count()).select_from(Assignment).where(
            Assignment.institution_id == scope, Assignment.created_by_user_id.is_not(None), Assignment.status == AssignmentStatus.PUBLISHED))).scalar_one()
        received = (await self.session.execute(select(func.count(func.distinct(AssignmentSubmission.target_id))).join(
            AssignmentTarget, AssignmentSubmission.target_id == AssignmentTarget.id).join(Assignment, AssignmentTarget.assignment_id == Assignment.id).where(
            Assignment.institution_id == scope, Assignment.created_by_user_id.is_not(None), AssignmentSubmission.submitted_at.is_not(None)))).scalar_one()
        return {"active_courses_count": course_count, "published_assignments_count": task_count,
                "recipient_assignments_ever_received_count": received}

    async def tasks(self, context, filters, *, student_id=None):
        conditions = [Assignment.institution_id == str(context.institution_id), Assignment.created_by_user_id.is_not(None),
            Assignment.status.in_([AssignmentStatus.PUBLISHED, AssignmentStatus.COMPLETED, AssignmentStatus.ARCHIVED]),
            select(AssignmentVersion.id).where(AssignmentVersion.assignment_id == Assignment.id).correlate(Assignment).exists()]
        if student_id:
            conditions.append(select(AssignmentTarget.id).where(AssignmentTarget.assignment_id == Assignment.id,
                AssignmentTarget.student_id == str(student_id)).correlate(Assignment).exists())
        else:
            conditions.append(teacher_scope(context))
        for key, column in [("course_id", Assignment.course_id), ("classroom_id", Assignment.planner_classroom_id),
                            ("academic_period_id", Assignment.academic_period_id)]:
            if getattr(filters, key):
                conditions.append(column == str(getattr(filters, key)))
        base = select(Assignment).where(*conditions)
        total = (await self.session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        tasks = list((await self.session.execute(base.order_by(Assignment.due_at, Assignment.id).offset(
            (filters.page-1)*filters.page_size).limit(filters.page_size))).scalars())
        if not tasks:
            return [], total
        target_conditions = [AssignmentTarget.assignment_id.in_([x.id for x in tasks])]
        if student_id:
            target_conditions.append(AssignmentTarget.student_id == str(student_id))
        target_scope = select(AssignmentTarget.id.label("target_id"), AssignmentTarget.assignment_id).where(*target_conditions).subquery()
        ranked = select(AssignmentSubmission.target_id, AssignmentSubmission.status,
            AssignmentSubmission.receipt["late"].as_boolean().label("late"),
            func.row_number().over(partition_by=AssignmentSubmission.target_id, order_by=AssignmentSubmission.attempt_number.desc()).label("n"),
        ).where(AssignmentSubmission.target_id.in_(select(target_scope.c.target_id))).subquery()
        latest = select(ranked).where(ranked.c.n == 1).subquery()
        received = latest.c.status.in_(planner_rules.RECEIVED_SUBMISSION_STATES)
        rows = (await self.session.execute(select(target_scope.c.assignment_id,
            func.count().label("recipients_count"), func.count().filter(received).label("received_count"),
            func.count().filter(latest.c.status.is_(None) | latest.c.status.in_(planner_rules.PENDING_SUBMISSION_STATES)).label("pending_count"),
            func.count().filter(latest.c.status.in_(["submitted", "late_submitted"])).label("review_pending_count"),
            func.count().filter(latest.c.status.in_(planner_rules.REVIEWED_SUBMISSION_STATES)).label("reviewed_count"),
            func.count().filter(latest.c.late.is_(True)).label("late_received_count"),
        ).select_from(target_scope.outerjoin(latest, latest.c.target_id == target_scope.c.target_id)).group_by(target_scope.c.assignment_id))).mappings().all()
        counts = {row["assignment_id"]: dict(row) for row in rows}
        return [{"assignment_id": task.id, "title": task.title, "status": task.status.value,
                 "academic_period_id": task.academic_period_id,
                 **counts.get(task.id, {"recipients_count": 0, "received_count": 0, "review_pending_count": 0,
                                       "reviewed_count": 0, "late_received_count": 0, "pending_count": 0})} for task in tasks], total

    async def courses(self, institution_id, filters):
        base = select(Course).where(Course.institution_id == str(institution_id), Course.status == "active")
        if filters.course_id:
            base = base.where(Course.id == str(filters.course_id))
        if filters.grade_id:
            base = base.where(Course.grade_id == str(filters.grade_id))
        total = (await self.session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        courses = list((await self.session.execute(base.order_by(Course.sequence, Course.id).offset(
            (filters.page-1)*filters.page_size).limit(filters.page_size))).scalars())
        counts = {}
        if courses:
            catalog = ProgressRepository(self.session).catalog_statement(institution_id, [c.id for c in courses]).subquery()
            counts = dict((await self.session.execute(select(catalog.c.course_id, func.count()).group_by(catalog.c.course_id))).all())
        return [{"course_id": c.id, "title": c.name, "grade_id": c.grade_id,
                 "published_applicable_lessons_count": counts.get(c.id, 0)} for c in courses], total

    async def completion_series(self, institution_id, student_id, zone, filters):
        day = func.date(func.timezone(zone, LearningProgress.completed_at))
        grouped = select(day.label("occurred_on"), func.count().label("lesson_completions_occurred_count")).where(
            LearningProgress.student_id == str(student_id), LearningProgress.status == "completed",
            LearningProgress.metadata_["origin"].as_string() == ORIGIN,
            LearningProgress.metadata_["institution_id"].as_string() == str(institution_id),
            LearningProgress.completed_at >= filters.since, LearningProgress.completed_at < filters.until,
        ).group_by(day).subquery()
        total = (await self.session.execute(select(func.count()).select_from(grouped))).scalar_one()
        rows = (await self.session.execute(select(grouped).order_by(grouped.c.occurred_on).offset(
            (filters.page-1)*filters.page_size).limit(filters.page_size))).mappings().all()
        return [dict(row) for row in rows], total
