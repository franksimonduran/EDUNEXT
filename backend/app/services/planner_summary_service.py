"""Counts use recipients and latest submission state, never attempt totals as pupils."""

from sqlalchemy import and_, func, select

from app.core import planner_rules as rules
from app.db.models import Assignment, AssignmentTarget, ReinforcementPlan
from app.db.models.assignment import AssignmentStatus
from app.db.models.planner import AssignmentSubmission, CalendarEvent
from app.services.planner_access_service import PlannerAccessService


class PlannerSummaryService:
    def __init__(self, session):
        self.session = session

    async def recipient_counts(self, context, *, student_id=None, task_id=None):
        conditions = [Assignment.institution_id == str(context.institution_id), Assignment.created_by_user_id.is_not(None)]
        if student_id:
            conditions.append(AssignmentTarget.student_id == str(student_id))
        if task_id:
            conditions.append(Assignment.id == str(task_id))
        population = select(AssignmentTarget.id.label("target_id"), Assignment.status.label("task_status"),
            func.coalesce(AssignmentTarget.custom_due_at, Assignment.due_at).label("due_at")).join(
                Assignment, AssignmentTarget.assignment_id == Assignment.id,
            ).where(*conditions).subquery()
        ranked = select(AssignmentSubmission.target_id, AssignmentSubmission.status, AssignmentSubmission.receipt["late"].as_boolean().label("late"),
            func.row_number().over(partition_by=AssignmentSubmission.target_id, order_by=AssignmentSubmission.attempt_number.desc()).label("n"),
        ).where(AssignmentSubmission.target_id.in_(select(population.c.target_id))).subquery()
        latest = select(ranked.c.target_id, ranked.c.status, ranked.c.late).where(ranked.c.n == 1).subquery()
        pending = latest.c.status.is_(None) | latest.c.status.in_(rules.PENDING_SUBMISSION_STATES)
        received = latest.c.status.in_(rules.RECEIVED_SUBMISSION_STATES)
        query = select(
            func.count().label("recipients_count"),
            func.count().filter((population.c.task_status == AssignmentStatus.PUBLISHED) & pending).label("pending_count"),
            func.count().filter(received).label("received_count"),
            func.count().filter((population.c.task_status == AssignmentStatus.PUBLISHED) & pending & (population.c.due_at < rules.now_utc())).label("overdue_pending_count"),
            func.count().filter(latest.c.late.is_(True)).label("late_received_count"),
            func.count().filter(latest.c.status.in_(rules.REVIEWED_SUBMISSION_STATES)).label("reviewed_count"),
        ).select_from(population.outerjoin(latest, latest.c.target_id == population.c.target_id))
        return dict((await self.session.execute(query)).mappings().one())

    async def personal(self, context):
        student = await PlannerAccessService(self.session).student(context, rules.READ)
        counts = await self.recipient_counts(context, student_id=student.id)
        active_plans = (await self.session.execute(select(func.count()).select_from(ReinforcementPlan).where(
            ReinforcementPlan.student_id == student.id, ReinforcementPlan.status.in_(["assigned", "in_progress"]),
            ReinforcementPlan.metadata_["origin"].as_string() == "planner42",
            ReinforcementPlan.metadata_["institution_id"].as_string() == str(context.institution_id),
        ))).scalar_one()
        return {**counts, "active_reinforcement_count": active_plans, "source": "calculated_from_server_records",
                "definition": "One recipient per assignment; latest submission version only",
                "upcoming_assessments_count": None, "assessment_data_status": "not_available",
                 "remote_notifications": "not_available"}

    async def institution(self, context):
        rules.permission(context, "planner.read_institution_aggregates")
        scope = str(context.institution_id)
        tasks = (await self.session.execute(select(func.count()).select_from(Assignment).where(
            Assignment.institution_id == scope, Assignment.created_by_user_id.is_not(None),
            Assignment.status == AssignmentStatus.PUBLISHED,
        ))).scalar_one()
        received = (await self.session.execute(select(func.count(func.distinct(AssignmentSubmission.target_id))).join(
            AssignmentTarget, AssignmentSubmission.target_id == AssignmentTarget.id,
        ).join(Assignment, AssignmentTarget.assignment_id == Assignment.id).where(
            Assignment.institution_id == scope, Assignment.created_by_user_id.is_not(None),
            AssignmentSubmission.submitted_at.is_not(None),
        ))).scalar_one()
        events = (await self.session.execute(select(func.count()).select_from(CalendarEvent).where(
            CalendarEvent.institution_id == scope, CalendarEvent.scope == "institution", CalendarEvent.status == "published",
        ))).scalar_one()
        plans = (await self.session.execute(select(func.count()).select_from(ReinforcementPlan).where(
            ReinforcementPlan.metadata_["institution_id"].as_string() == scope,
            ReinforcementPlan.metadata_["origin"].as_string() == "planner42",
            ReinforcementPlan.status.in_(["assigned", "in_progress"]),
        ))).scalar_one()
        return {"published_assignments_count": tasks, "received_recipient_assignments_count": received,
                "active_reinforcements_count": plans, "institutional_events_count": events,
                "source": "calculated_from_server_records",
                "definition": "Institution-wide counts; received counts distinct recipients per task, not attempts"}
