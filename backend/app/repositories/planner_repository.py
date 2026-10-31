"""Institution and audience filters applied in PostgreSQL before pagination."""

from sqlalchemy import and_, func, or_, select

from app.core.exceptions import NotFoundError
from app.core.planner_rules import now_utc
from app.db.models import Assignment, AssignmentTarget, Enrollment, EnrollmentStatus, MonitorProfile, TeacherAssignment, User, UserStatus
from app.db.models.assignment import AssignmentStatus
from app.db.models.planner import AssignmentSubmission, AssignmentVersion


def teacher_scope(context):
    now = now_utc()
    return select(TeacherAssignment.id).join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id).join(User, MonitorProfile.user_id == User.id).where(
        User.id == str(context.user_id), User.status == UserStatus.ACTIVE, User.institution_id == str(context.institution_id),
        TeacherAssignment.institution_id == str(context.institution_id), TeacherAssignment.status == "active",
        TeacherAssignment.course_id == Assignment.course_id, TeacherAssignment.classroom_id == Assignment.planner_classroom_id,
        or_(TeacherAssignment.period_id.is_(None), TeacherAssignment.period_id == Assignment.academic_period_id),
        or_(TeacherAssignment.start_date.is_(None), TeacherAssignment.start_date <= now),
        or_(TeacherAssignment.end_date.is_(None), TeacherAssignment.end_date > now),
    ).correlate(Assignment).exists()


class PlannerRepository:
    def __init__(self, session):
        self.session = session

    async def task(self, institution_id, task_id, *, lock=False):
        query = select(Assignment).where(Assignment.id == str(task_id), Assignment.institution_id == str(institution_id), Assignment.created_by_user_id.is_not(None))
        if lock:
            query = query.with_for_update()
        task = (await self.session.execute(query.execution_options(populate_existing=True))).scalars().first()
        if task is None:
            raise NotFoundError("Assignment not found")
        return task

    async def target(self, task_id, student_id, *, lock=False):
        query = select(AssignmentTarget).where(AssignmentTarget.assignment_id == str(task_id), AssignmentTarget.student_id == str(student_id))
        if lock:
            query = query.with_for_update()
        target = (await self.session.execute(query.execution_options(populate_existing=True))).scalars().first()
        if target is None:
            raise NotFoundError("Assignment is not addressed to this student")
        return target

    async def version(self, task_id):
        version = (await self.session.execute(select(AssignmentVersion).where(AssignmentVersion.assignment_id == str(task_id)).order_by(AssignmentVersion.version_number.desc()).limit(1))).scalars().first()
        if version is None:
            raise NotFoundError("Published assignment version not found")
        return version

    async def list_tasks(self, context, *, student_id=None, page=1, page_size=25, course_id=None, classroom_id=None, period_id=None):
        filters = [Assignment.institution_id == str(context.institution_id), Assignment.created_by_user_id.is_not(None)]
        if student_id:
            filters.extend([Assignment.status.in_([AssignmentStatus.PUBLISHED, AssignmentStatus.COMPLETED, AssignmentStatus.ARCHIVED]), select(AssignmentTarget.id).where(
                AssignmentTarget.assignment_id == Assignment.id, AssignmentTarget.student_id == str(student_id),
            ).correlate(Assignment).exists()])
        else:
            filters.append(teacher_scope(context))
        if course_id:
            filters.append(Assignment.course_id == str(course_id))
        if classroom_id:
            filters.append(Assignment.planner_classroom_id == str(classroom_id))
        if period_id:
            filters.append(Assignment.academic_period_id == str(period_id))
        base = select(Assignment).where(*filters)
        total = (await self.session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        items = (await self.session.execute(base.order_by(Assignment.due_at, Assignment.id).offset((page-1)*page_size).limit(page_size))).scalars().all()
        return items, total

    async def submissions(self, task_id, *, page, page_size):
        base = select(AssignmentSubmission).join(AssignmentTarget, AssignmentSubmission.target_id == AssignmentTarget.id).where(AssignmentTarget.assignment_id == str(task_id))
        total = (await self.session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        return (await self.session.execute(base.order_by(AssignmentSubmission.created_at, AssignmentSubmission.id).offset((page-1)*page_size).limit(page_size))).scalars().all(), total
