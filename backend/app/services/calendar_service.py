"""Civil-date-aware personal calendar; task deadlines are projected, not copied."""

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import Date, DateTime, String, cast, func, literal, or_, select, union_all

from app.core import planner_rules as rules
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import AcademicYear, Assignment, AssignmentTarget, Classroom, Course, Enrollment, EnrollmentStatus, Institution, ReinforcementPlan
from app.db.models.assignment import AssignmentStatus
from app.db.models.planner import CalendarEvent
from app.repositories.progress_repository import ProgressRepository
from app.services.assignment_service import AssignmentService
from app.services.planner_access_service import PlannerAccessService


def event_read(event):
    return {"id": event.id, "title": event.title, "description": event.description, "scope": event.scope,
            "classroom_id": event.classroom_id, "course_id": event.course_id, "all_day": event.all_day,
            "starts_on": event.starts_on, "ends_on": event.ends_on, "starts_at": event.starts_at,
            "ends_at": event.ends_at, "status": event.status, "revision": event.revision}


class CalendarService:
    def __init__(self, session):
        self.session = session
        self.access = PlannerAccessService(session)

    async def authorize(self, context, scope, classroom_id, course_id):
        if scope == "institution":
            rules.permission(context, rules.CALENDAR_INSTITUTION)
            return
        rules.permission(context, rules.CALENDAR_MANAGE)
        from app.db.models import MonitorProfile, TeacherAssignment, User, UserStatus
        now = rules.now_utc()
        query = select(TeacherAssignment.id).join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id).join(User, MonitorProfile.user_id == User.id).join(Classroom, TeacherAssignment.classroom_id == Classroom.id).join(
            Course, TeacherAssignment.course_id == Course.id,
        ).join(AcademicYear, Classroom.academic_year_id == AcademicYear.id).where(
            User.id == str(context.user_id), User.status == UserStatus.ACTIVE, User.institution_id == str(context.institution_id),
            TeacherAssignment.institution_id == str(context.institution_id), TeacherAssignment.classroom_id == str(classroom_id),
            TeacherAssignment.status == "active", Classroom.institution_id == str(context.institution_id), Classroom.status == "active",
            Course.institution_id == str(context.institution_id), Course.status == "active", Course.grade_id == Classroom.grade_id,
            AcademicYear.institution_id == str(context.institution_id), AcademicYear.status.in_(["active", "planned"]),
            or_(TeacherAssignment.start_date.is_(None), TeacherAssignment.start_date <= now),
            or_(TeacherAssignment.end_date.is_(None), TeacherAssignment.end_date > now),
        )
        if course_id:
            query = query.where(TeacherAssignment.course_id == str(course_id))
        if (await self.session.execute(query.limit(1))).first() is None:
            raise ForbiddenError("No active calendar management assignment")

    async def create(self, context, data):
        await self.authorize(context, data.scope, data.classroom_id, data.course_id)
        event = CalendarEvent(**data.model_dump(mode="python"), institution_id=str(context.institution_id), created_by_user_id=str(context.user_id), revision=1)
        # UUID(as_uuid=False) expects strings, not user-controlled paths or names.
        event.classroom_id = str(data.classroom_id) if data.classroom_id else None
        event.course_id = str(data.course_id) if data.course_id else None
        self.session.add(event)
        await self.session.flush()
        AssignmentService(self.session).audit(context, event.id, "calendar.created")
        return event_read(event)

    async def get(self, context, event_id, *, as_teacher=False):
        event = (await self.session.execute(select(CalendarEvent).where(CalendarEvent.id == str(event_id), CalendarEvent.institution_id == str(context.institution_id)))).scalars().first()
        if event is None:
            raise NotFoundError("Event not found")
        if as_teacher:
            await self.authorize(context, event.scope, event.classroom_id, event.course_id)
        else:
            student = await self.access.student(context, rules.CALENDAR_READ)
            if event.scope != "institution":
                institution = await self.session.get(Institution, str(context.institution_id))
                now = rules.now_utc()
                local_today = now.astimezone(ZoneInfo(institution.timezone)).date()
                row = (await self.session.execute(select(Enrollment.id).join(Classroom, Enrollment.classroom_id == Classroom.id).join(AcademicYear, Enrollment.academic_year_id == AcademicYear.id).where(
                    Enrollment.student_id == student.id, Enrollment.institution_id == str(context.institution_id),
                    Enrollment.classroom_id == event.classroom_id, Enrollment.status == EnrollmentStatus.ACTIVE,
                    Classroom.status == "active", Classroom.institution_id == str(context.institution_id),
                    AcademicYear.status == "active", AcademicYear.institution_id == str(context.institution_id),
                    Classroom.academic_year_id == AcademicYear.id,
                    AcademicYear.start_date <= local_today, AcademicYear.end_date >= local_today,
                    or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= now),
                    or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > now),
                ).limit(1))).first()
                if row is None:
                    raise NotFoundError("Event not available")
                if event.course_id:
                    courses, _ = await ProgressRepository(self.session).courses(context, student.id)
                    if event.course_id not in {c.id for c in courses}:
                        raise NotFoundError("Event not available")
        return event_read(event)

    async def change(self, context, event_id, data, *, cancel=False):
        event = (await self.session.execute(select(CalendarEvent).where(CalendarEvent.id == str(event_id), CalendarEvent.institution_id == str(context.institution_id)).with_for_update().execution_options(populate_existing=True))).scalars().first()
        if event is None:
            raise NotFoundError("Event not found")
        await self.authorize(context, event.scope, event.classroom_id, event.course_id)
        rules.revision(event.revision, data.expected_revision)
        if event.status == "cancelled":
            raise ConflictError("Cancelled event is retained and cannot be edited")
        previous = {"title": event.title, "starts_on": str(event.starts_on) if event.starts_on else None,
                    "ends_on": str(event.ends_on) if event.ends_on else None,
                    "starts_at": event.starts_at.isoformat() if event.starts_at else None,
                    "ends_at": event.ends_at.isoformat() if event.ends_at else None}
        if cancel:
            event.status = "cancelled"
        else:
            if data.scope != event.scope or (str(data.classroom_id) if data.classroom_id else None) != event.classroom_id or (str(data.course_id) if data.course_id else None) != event.course_id:
                raise ValidationError("Audience cannot be changed by generic edit")
            for key, value in data.model_dump(exclude={"expected_revision", "scope", "classroom_id", "course_id"}).items():
                setattr(event, key, value)
        event.revision += 1
        AssignmentService(self.session).audit(context, event.id, "calendar.cancelled" if cancel else "calendar.changed", previous=previous, revision=event.revision)
        return event_read(event)

    async def personal(self, context, start, end, *, page, page_size):
        if end <= start or (end-start).days > 93:
            raise ValidationError("Calendar range must contain 1 to 93 days, with an exclusive end")
        student = await self.access.student(context, rules.CALENDAR_READ)
        institution = await self.session.get(Institution, str(context.institution_id))
        zone = ZoneInfo(institution.timezone)
        lower = datetime.combine(start, time.min, tzinfo=zone)
        upper = datetime.combine(end, time.min, tzinfo=zone)
        now = rules.now_utc()
        classrooms = select(Enrollment.classroom_id).join(Classroom, Enrollment.classroom_id == Classroom.id).join(AcademicYear, Enrollment.academic_year_id == AcademicYear.id).where(
            Enrollment.student_id == student.id, Enrollment.institution_id == str(context.institution_id), Enrollment.status == EnrollmentStatus.ACTIVE,
            Classroom.institution_id == str(context.institution_id), Classroom.status == "active",
            Classroom.academic_year_id == AcademicYear.id, AcademicYear.institution_id == str(context.institution_id), AcademicYear.status == "active",
            AcademicYear.start_date <= now.astimezone(zone).date(), AcademicYear.end_date >= now.astimezone(zone).date(),
            or_(Enrollment.effective_date.is_(None), Enrollment.effective_date <= now),
            or_(Enrollment.ended_at.is_(None), Enrollment.ended_at > now),
        )
        courses, _ = await ProgressRepository(self.session).courses(context, student.id)
        e = CalendarEvent
        event_query = select(
            (literal("event:")+cast(e.id, String)).label("event_id"), literal("calendar_event").label("source"),
            cast(e.id, String).label("source_id"), e.title, e.all_day, e.starts_on, e.ends_on, e.starts_at, e.ends_at, e.status,
        ).where(
            e.institution_id == str(context.institution_id),
            or_(e.scope == "institution", (e.classroom_id.in_(classrooms) & ((e.scope == "classroom") | e.course_id.in_([c.id for c in courses])))),
            or_((e.all_day.is_(True) & (e.starts_on < end) & (e.ends_on > start)),
                (e.all_day.is_(False) & (e.starts_at < upper) & (e.ends_at > lower))),
        )
        deadline = func.coalesce(AssignmentTarget.custom_due_at, Assignment.due_at)
        task_query = select(
            (literal("assignment:")+cast(AssignmentTarget.id, String)).label("event_id"), literal("assignment").label("source"),
            cast(Assignment.id, String).label("source_id"), Assignment.title, literal(False).label("all_day"),
            cast(literal(None), Date).label("starts_on"), cast(literal(None), Date).label("ends_on"),
            deadline.label("starts_at"), deadline.label("ends_at"), cast(Assignment.status, String).label("status"),
        ).join(AssignmentTarget, AssignmentTarget.assignment_id == Assignment.id).where(
            Assignment.institution_id == str(context.institution_id), AssignmentTarget.student_id == student.id,
            Assignment.status.in_([AssignmentStatus.PUBLISHED, AssignmentStatus.COMPLETED]), deadline >= lower, deadline < upper,
        )
        r = ReinforcementPlan
        reinforcement_query = select(
            (literal("reinforcement:")+cast(r.id, String)).label("event_id"), literal("reinforcement").label("source"),
            cast(r.id, String).label("source_id"), r.title, literal(False).label("all_day"),
            cast(literal(None), Date).label("starts_on"), cast(literal(None), Date).label("ends_on"),
            r.end_date.label("starts_at"), r.end_date.label("ends_at"), r.status,
        ).where(r.student_id == student.id, r.metadata_["origin"].as_string() == "planner42",
                r.metadata_["institution_id"].as_string() == str(context.institution_id), r.status != "draft", r.end_date >= lower, r.end_date < upper)
        events = union_all(event_query, task_query, reinforcement_query).subquery()
        total = (await self.session.execute(select(func.count()).select_from(events))).scalar_one()
        order_date = func.coalesce(events.c.starts_on, cast(func.timezone(institution.timezone, events.c.starts_at), Date))
        rows = (await self.session.execute(select(events).order_by(order_date, events.c.starts_at.nullsfirst(), events.c.event_id).offset((page-1)*page_size).limit(page_size))).mappings().all()
        return {"items": [dict(row) for row in rows], "total": total, "page": page, "page_size": page_size,
                "timezone": institution.timezone, "assessments": {"data_status": "not_available", "reason": "Verified assessment scheduling is not implemented"},
                "notifications": {"remote_delivery": "not_available"}}
