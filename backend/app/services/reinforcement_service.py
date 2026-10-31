"""Teacher-authored reinforcement using the existing plan model and published lessons."""

from sqlalchemy import select

from app.core import planner_rules as rules
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Enrollment, ReinforcementPlan
from app.repositories.progress_repository import ProgressRepository
from app.services.planner_access_service import PlannerAccessService


def reinforcement_read(plan):
    return {"id": plan.id, "course_id": plan.course_id, "title": plan.title, "objectives": plan.objectives,
            "instructions": plan.description, "status": plan.status, "available_from": plan.start_date,
            "due_at": plan.end_date, "activities": plan.activities, "revision": plan.metadata_["revision"],
            "source": "teacher_authored", "purpose": "formative_reinforcement"}


class ReinforcementService:
    def __init__(self, session):
        self.session = session
        self.access = PlannerAccessService(session)

    async def create(self, context, data):
        assignment = await self.access.teacher(context, data.course_id, data.classroom_id, data.academic_period_id, "reinforcement.manage")
        _, _, _, year, _ = await self.access.academic_context(context, data.course_id, data.classroom_id, data.academic_period_id, data.available_from, data.due_at)
        enrollment = await self.access.enrolled(context, data.classroom_id, year.id, student_ids=[data.student_id])
        if len(enrollment) != 1:
            raise ValidationError("An active recipient enrollment is required")
        catalog = await ProgressRepository(self.session).catalog(context.institution_id, [data.course_id])
        authorized = {str(x.lesson_id): str(x.version_id) for x in catalog}
        if not all(str(x) in authorized for x in data.lesson_ids):
            raise ValidationError("Every reinforcement activity must reference an authorized published lesson")
        plan = ReinforcementPlan(student_id=str(data.student_id), course_id=str(data.course_id), title=data.title,
            description=data.instructions, objectives=[data.objective], status="draft", assigned_by=assignment.monitor_id,
            start_date=data.available_from, end_date=data.due_at,
            activities=[{"id": str(x), "lesson_id": str(x), "lesson_version_id": authorized[str(x)]} for x in data.lesson_ids],
            metadata_={"origin": "planner42", "institution_id": str(context.institution_id), "classroom_id": str(data.classroom_id),
                       "academic_period_id": str(data.academic_period_id), "enrollment_id": enrollment[0].id, "revision": 1})
        self.session.add(plan)
        await self.session.flush()
        from app.services.assignment_service import AssignmentService
        AssignmentService(self.session).audit(context, plan.id, "reinforcement.created")
        return reinforcement_read(plan)

    async def get(self, context, plan_id, *, lock=False):
        query = select(ReinforcementPlan).where(ReinforcementPlan.id == str(plan_id),
            ReinforcementPlan.metadata_["origin"].as_string() == "planner42",
            ReinforcementPlan.metadata_["institution_id"].as_string() == str(context.institution_id))
        if lock:
            query = query.with_for_update()
        plan = (await self.session.execute(query.execution_options(populate_existing=True))).scalars().first()
        if plan is None:
            raise NotFoundError("Reinforcement not found")
        return plan

    async def transition(self, context, plan_id, data, action):
        plan = await self.get(context, plan_id, lock=True)
        meta = plan.metadata_
        rules.revision(meta["revision"], data.expected_revision)
        if action in {"assign", "review", "cancel"}:
            await self.access.teacher(context, plan.course_id, meta["classroom_id"], meta["academic_period_id"], "reinforcement.manage")
        else:
            student = await self.access.student(context, "reinforcement.read_own")
            if student.id != plan.student_id:
                raise NotFoundError("Reinforcement not found")
            original = await self.session.get(Enrollment, meta["enrollment_id"])
            enrollment = await self.access.enrolled(context, meta["classroom_id"], original.academic_year_id,
                student_ids=[plan.student_id]) if original else []
            if not any(x.id == meta["enrollment_id"] for x in enrollment):
                raise ForbiddenError("Original reinforcement enrollment is no longer active")
            now = rules.now_utc()
            if now < plan.start_date or now > plan.end_date:
                raise ConflictError("Reinforcement is outside its availability window")
        transitions = {"assign": ("draft", "assigned"), "start": ("assigned", "in_progress"),
                       "complete": ("in_progress", "completed"), "review": ("completed", "reviewed")}
        if action == "cancel":
            if plan.status in {"cancelled", "reviewed"}:
                raise ConflictError("Plan cannot be cancelled in this state")
            plan.status = "cancelled"
        else:
            source, destination = transitions[action]
            if plan.status != source:
                raise ConflictError("Invalid reinforcement transition")
            if action == "assign":
                enrolled = await self.session.get(Enrollment, meta["enrollment_id"])
                active = await self.access.enrolled(context, meta["classroom_id"], enrolled.academic_year_id,
                    student_ids=[plan.student_id]) if enrolled else []
                if not any(x.id == meta["enrollment_id"] for x in active):
                    raise ConflictError("Recipient enrollment is no longer active")
                await self.access.academic_context(context, plan.course_id, meta["classroom_id"], meta["academic_period_id"], plan.start_date, plan.end_date)
                catalog = await ProgressRepository(self.session).catalog(context.institution_id, [plan.course_id])
                published = {(str(x.lesson_id), str(x.version_id)) for x in catalog}
                if not all((a["lesson_id"], a["lesson_version_id"]) in published for a in plan.activities):
                    raise ConflictError("Reinforcement resources changed; prepare a new plan")
            plan.status = destination
            if action == "complete":
                plan.completed_at = rules.now_utc()
                plan.completed_by = str(context.user_id)
        plan.metadata_ = {**meta, "revision": meta["revision"]+1}
        from app.services.assignment_service import AssignmentService
        AssignmentService(self.session).audit(context, plan.id, "reinforcement."+action)
        return reinforcement_read(plan)

    async def read(self, context, plan_id, *, as_teacher=False):
        plan = await self.get(context, plan_id)
        if as_teacher:
            await self.access.teacher(context, plan.course_id, plan.metadata_["classroom_id"],
                plan.metadata_["academic_period_id"], "reinforcement.manage")
        else:
            student = await self.access.student(context, "reinforcement.read_own")
            if student.id != plan.student_id or plan.status == "draft":
                raise NotFoundError("Reinforcement not found")
        return reinforcement_read(plan)
