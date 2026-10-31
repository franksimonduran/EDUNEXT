"""Academic planner HTTP boundary; state changes commit before success."""

from datetime import date
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core import planner_rules as rules
from app.core.exceptions import ConflictError, NotFoundError, ServiceUnavailableError
from app.db.models import Assignment, AssignmentTarget, ReinforcementPlan
from app.db.models.planner import AssignmentSubmission, CalendarEvent
from app.db.session import get_async_session_dependency
from app.dependencies.auth import get_authorization_context
from app.schemas.permission import AuthorizationContext
from app.schemas.planner import AssignmentCreate, AssignmentUpdate, CalendarCreate, CalendarReplace, ExtensionInput, FeedbackCreate, ReinforcementCreate, RevisionInput, SubmissionSave
from app.services.assignment_service import AssignmentService, submission_read, task_read
from app.services.calendar_service import CalendarService
from app.services.reinforcement_service import ReinforcementService, reinforcement_read


def private_response(response: Response):
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["Vary"] = "Authorization, Cookie"


router = APIRouter(tags=["Academic planner"], dependencies=[Depends(private_response)])
Context = Depends(get_authorization_context)
async def planner_database():
    async for session in get_async_session_dependency():
        try:
            yield session
        except IntegrityError:
            await session.rollback()
            raise ConflictError("Planner data conflicts with an existing record or academic context") from None
        except SQLAlchemyError:
            await session.rollback()
            raise ServiceUnavailableError("Academic planner persistence is unavailable") from None


Database = Depends(planner_database)


@router.get("/planner-context/me")
async def teaching_contexts(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                            context: AuthorizationContext = Context, session: AsyncSession = Database):
    from app.services.planner_access_service import PlannerAccessService
    return await PlannerAccessService(session).teaching_contexts(context, page=page, page_size=page_size)


@router.post("/assignments", status_code=201)
async def create_assignment(data: AssignmentCreate, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).create(context, data)
    await session.commit()
    return result


@router.get("/assignments/me")
async def own_assignments(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), course_id: UUID | None = None,
                          context: AuthorizationContext = Context, session: AsyncSession = Database):
    service = AssignmentService(session)
    student = await service.access.student(context, rules.READ)
    items, total = await service.repo.list_tasks(context, student_id=student.id, page=page, page_size=page_size, course_id=course_id)
    targets = list((await session.execute(select(AssignmentTarget).where(AssignmentTarget.student_id == student.id,
        AssignmentTarget.assignment_id.in_([x.id for x in items])))).scalars())
    target_map = {x.assignment_id: x for x in targets}
    versions = list((await session.execute(select(AssignmentSubmission).where(AssignmentSubmission.target_id.in_([x.id for x in targets])).order_by(
        AssignmentSubmission.attempt_number.desc()))).scalars()) if targets else []
    latest = {}
    for submission in versions:
        latest.setdefault(submission.target_id, submission)
    result = []
    for task in items:
        target = target_map[task.id]
        submission = latest.get(target.id)
        value = {**task_read(task), "target_id": target.id, "effective_due_at": target.custom_due_at or task.due_at,
                 "submission_id": submission.id if submission else None, "submission_status": submission.status if submission else "not_started"}
        if rules.now_utc() < task.available_from:
            value["instructions"] = None
        result.append(value)
    return {"items": result, "total": total, "page": page, "page_size": page_size}


@router.get("/assignments")
async def teacher_assignments(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), course_id: UUID | None = None,
                              classroom_id: UUID | None = None, period_id: UUID | None = None,
                              context: AuthorizationContext = Context, session: AsyncSession = Database):
    rules.permission(context, "assignments.read_assigned")
    items, total = await AssignmentService(session).repo.list_tasks(context, page=page, page_size=page_size, course_id=course_id, classroom_id=classroom_id, period_id=period_id)
    return {"items": [task_read(x) for x in items], "total": total, "page": page, "page_size": page_size}


@router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: UUID, as_teacher: bool = False, context: AuthorizationContext = Context, session: AsyncSession = Database):
    service = AssignmentService(session)
    if as_teacher:
        return task_read(await service.teacher_task(context, assignment_id, "assignments.read_assigned"))
    task, target, student = await service.own_task(context, assignment_id)
    result = task_read(task)
    result.update({"target_id": target.id, "target_revision": target.planner_revision, "effective_due_at": target.custom_due_at or task.due_at})
    if rules.now_utc() < task.available_from:
        result["instructions"] = None
        result["availability"] = "future"
    else:
        result["availability"] = "available" if task.status.value == "published" else "closed"
    return result


@router.patch("/assignments/{assignment_id}")
async def update_assignment(assignment_id: UUID, data: AssignmentUpdate, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).update(context, assignment_id, data)
    await session.commit()
    return result


@router.post("/assignments/{assignment_id}/publish")
async def publish_assignment(assignment_id: UUID, data: RevisionInput,
                             key: str = Header(alias="Idempotency-Key", min_length=1, max_length=128),
                             context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).publish(context, assignment_id, data, key)
    await session.commit()
    return result


@router.post("/assignments/{assignment_id}/close")
async def close_assignment(assignment_id: UUID, data: RevisionInput, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).close(context, assignment_id, data)
    await session.commit()
    return result


@router.get("/assignments/{assignment_id}/targets")
async def targets(assignment_id: UUID, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                  context: AuthorizationContext = Context, session: AsyncSession = Database):
    task = await AssignmentService(session).teacher_task(context, assignment_id, "assignments.read_assigned")
    query = select(AssignmentTarget).where(AssignmentTarget.assignment_id == task.id)
    total = (await session.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    rows = (await session.execute(query.order_by(AssignmentTarget.id).offset((page-1)*page_size).limit(page_size))).scalars()
    return {"items": [{"id": x.id, "student_id": x.student_id, "enrollment_id": x.enrollment_id,
                       "due_at": x.custom_due_at or task.due_at, "revision": x.planner_revision} for x in rows], "total": total}


@router.post("/assignments/{assignment_id}/archive")
async def archive_assignment(assignment_id: UUID, data: RevisionInput, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).archive(context, assignment_id, data)
    await session.commit()
    return result


@router.post("/assignment-targets/{target_id}/extend")
async def extend_target(target_id: UUID, data: ExtensionInput, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).extend(context, target_id, data)
    await session.commit()
    return result


@router.post("/assignments/{assignment_id}/submissions", status_code=201)
async def begin_submission(assignment_id: UUID, key: str = Header(alias="Idempotency-Key", min_length=1, max_length=128),
                           context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).begin(context, assignment_id, key)
    await session.commit()
    return result


@router.get("/assignment-submissions/{submission_id}")
async def get_submission(submission_id: UUID, as_teacher: bool = False, context: AuthorizationContext = Context, session: AsyncSession = Database):
    return await AssignmentService(session).get_submission(context, submission_id, teacher=as_teacher)


@router.patch("/assignment-submissions/{submission_id}")
async def save_submission(submission_id: UUID, data: SubmissionSave, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).save(context, submission_id, data)
    await session.commit()
    return result


@router.post("/assignment-submissions/{submission_id}/submit")
async def submit(submission_id: UUID, data: RevisionInput, key: str = Header(alias="Idempotency-Key", min_length=1, max_length=128),
                 context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).submit(context, submission_id, data, key)
    await session.commit()
    return result


@router.post("/assignment-submissions/{submission_id}/resubmit", status_code=201)
async def resubmit(submission_id: UUID, key: str = Header(alias="Idempotency-Key", min_length=1, max_length=128),
                   context: AuthorizationContext = Context, session: AsyncSession = Database):
    service = AssignmentService(session)
    task, _, old = await service.submission_context(context, submission_id, rules.SUBMIT)
    result = await service.begin(context, task.id, key, previous_id=old.id)
    await session.commit()
    return result


@router.get("/assignments/{assignment_id}/submissions")
async def teacher_submissions(assignment_id: UUID, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                              context: AuthorizationContext = Context, session: AsyncSession = Database):
    service = AssignmentService(session)
    await service.teacher_task(context, assignment_id, rules.READ_SUBMISSIONS)
    rows, total = await service.repo.submissions(assignment_id, page=page, page_size=page_size)
    return {"items": [submission_read(x) for x in rows], "total": total, "page": page, "page_size": page_size,
            "definition": "Submission versions, not unique students"}


@router.get("/assignments/{assignment_id}/summary")
async def assignment_summary(assignment_id: UUID, context: AuthorizationContext = Context, session: AsyncSession = Database):
    await AssignmentService(session).teacher_task(context, assignment_id, rules.READ_SUBMISSIONS)
    from app.services.planner_summary_service import PlannerSummaryService
    return await PlannerSummaryService(session).recipient_counts(context, task_id=assignment_id)


@router.get("/planner-summary/me")
async def planner_summary(context: AuthorizationContext = Context, session: AsyncSession = Database):
    from app.services.planner_summary_service import PlannerSummaryService
    return await PlannerSummaryService(session).personal(context)


@router.post("/assignment-submissions/{submission_id}/feedback", status_code=201)
async def feedback(submission_id: UUID, data: FeedbackCreate, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).feedback(context, submission_id, data)
    await session.commit()
    return result


@router.get("/planner-summary/institution")
async def institutional_summary(context: AuthorizationContext = Context, session: AsyncSession = Database):
    from app.services.planner_summary_service import PlannerSummaryService
    return await PlannerSummaryService(session).institution(context)


@router.post("/assignment-feedback/{feedback_id}/publish")
async def publish_feedback(feedback_id: UUID, data: RevisionInput, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await AssignmentService(session).publish_feedback(context, feedback_id, data)
    await session.commit()
    return result


@router.post("/assignment-submissions/{submission_id}/attachments")
async def blocked_attachments(submission_id: UUID, context: AuthorizationContext = Context, session: AsyncSession = Database):
    await AssignmentService(session).submission_context(context, submission_id, rules.SUBMIT)
    raise ServiceUnavailableError("Private attachment storage and protected download are not verified; upload is disabled")


@router.post("/reinforcement-plans", status_code=201)
async def create_reinforcement(data: ReinforcementCreate, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await ReinforcementService(session).create(context, data)
    await session.commit()
    return result


@router.get("/reinforcement-plans/me")
async def own_reinforcements(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                             context: AuthorizationContext = Context, session: AsyncSession = Database):
    service = ReinforcementService(session)
    student = await service.access.student(context, "reinforcement.read_own")
    query = select(ReinforcementPlan).where(ReinforcementPlan.student_id == student.id,
        ReinforcementPlan.metadata_["origin"].as_string() == "planner42",
        ReinforcementPlan.metadata_["institution_id"].as_string() == str(context.institution_id), ReinforcementPlan.status != "draft")
    total = (await session.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    rows = (await session.execute(query.order_by(ReinforcementPlan.end_date, ReinforcementPlan.id).offset((page-1)*page_size).limit(page_size))).scalars()
    return {"items": [reinforcement_read(x) for x in rows], "total": total, "page": page, "page_size": page_size}


@router.post("/reinforcement-plans/{plan_id}/{action}")
async def reinforcement_transition(plan_id: UUID, action: Literal["assign", "start", "complete", "review", "cancel"], data: RevisionInput,
                                   context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await ReinforcementService(session).transition(context, plan_id, data, action)
    await session.commit()
    return result


@router.get("/reinforcement-plans/{plan_id}")
async def get_reinforcement(plan_id: UUID, as_teacher: bool = False, context: AuthorizationContext = Context, session: AsyncSession = Database):
    return await ReinforcementService(session).read(context, plan_id, as_teacher=as_teacher)


@router.post("/calendar-events", status_code=201)
async def create_event(data: CalendarCreate, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await CalendarService(session).create(context, data)
    await session.commit()
    return result


@router.get("/calendar-events")
async def calendar_events(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                          context: AuthorizationContext = Context, session: AsyncSession = Database):
    # Institutional event management only. Personal aggregation uses the own route.
    rules.permission(context, rules.CALENDAR_INSTITUTION)
    from app.services.calendar_service import event_read
    query = select(CalendarEvent).where(CalendarEvent.institution_id == str(context.institution_id), CalendarEvent.scope == "institution")
    total = (await session.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    rows = (await session.execute(query.order_by(CalendarEvent.created_at, CalendarEvent.id).offset((page-1)*page_size).limit(page_size))).scalars()
    return {"items": [event_read(x) for x in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/calendar-events/{event_id}")
async def get_event(event_id: UUID, as_teacher: bool = False, context: AuthorizationContext = Context, session: AsyncSession = Database):
    return await CalendarService(session).get(context, event_id, as_teacher=as_teacher)


@router.patch("/calendar-events/{event_id}")
async def update_event(event_id: UUID, data: CalendarReplace, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await CalendarService(session).change(context, event_id, data)
    await session.commit()
    return result


@router.post("/calendar-events/{event_id}/cancel")
async def cancel_event(event_id: UUID, data: RevisionInput, context: AuthorizationContext = Context, session: AsyncSession = Database):
    result = await CalendarService(session).change(context, event_id, data, cancel=True)
    await session.commit()
    return result


@router.get("/academic-calendar/me")
async def calendar(start: date, end: date, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                   context: AuthorizationContext = Context, session: AsyncSession = Database):
    return await CalendarService(session).personal(context, start, end, page=page, page_size=page_size)
