"""Planner tests with fictional data and the full migration chain in a rollback schema."""

from datetime import date, datetime, timedelta, timezone
import importlib.util
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError as SchemaError
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core import planner_rules as rules
from app.db.models import AcademicPeriod, AcademicYear, AssignmentTarget, Classroom, Course, Enrollment, EnrollmentStatus, Grade, Institution, MonitorProfile, StudentProfile, TeacherAssignment, User, UserStatus
from app.db.models.planner import AssignmentFeedback, AssignmentSubmission, AssignmentVersion, CalendarEvent, PlannerAudit
from app.schemas.permission import AuthorizationContext
from app.schemas.planner import AssignmentCreate, AssignmentUpdate, CalendarCreate, ExtensionInput, FeedbackCreate, RevisionInput, SubmissionSave
from app.services.assignment_service import AssignmentService
from app.services.calendar_service import CalendarService


@pytest.mark.parametrize("offset,allowed,late", [(0, False, False), (1, True, True), (-1, False, False)])
def test_deadline_boundary(offset, allowed, late):
    due = datetime(2026, 10, 23, 17, tzinfo=timezone.utc)
    assert rules.submission_late(due+timedelta(seconds=offset), due-timedelta(days=1), due, allowed) is late


def test_future_and_prohibited_late_submission():
    now = rules.now_utc()
    with pytest.raises(ConflictError):
        rules.submission_late(now, now+timedelta(seconds=1), now+timedelta(days=1), True)
    with pytest.raises(ConflictError):
        rules.submission_late(now, now-timedelta(days=2), now-timedelta(seconds=1), False)


@pytest.mark.parametrize("extra", ["score", "reviewed", "student_id", "attachment_ids", "achievement_level"])
def test_student_payload_is_strict(extra):
    with pytest.raises(SchemaError):
        SubmissionSave(expected_revision=1, response_text="Texto", **{extra: True})


def test_civil_calendar_dates_and_plain_text():
    event = CalendarCreate(title="Día escolar", scope="institution", all_day=True, starts_on="2026-10-23", ends_on="2026-10-24")
    assert event.starts_at is None and event.starts_on == date(2026, 10, 23)
    with pytest.raises(SchemaError):
        CalendarCreate(title="<script>alert(1)</script>", scope="institution", all_day=True, starts_on="2026-10-23", ends_on="2026-10-24")
    with pytest.raises(SchemaError):
        CalendarCreate(title="Sin zona", scope="institution", starts_at="2026-10-23T12:00:00", ends_at="2026-10-23T13:00:00")


@pytest.mark.asyncio
async def test_real_postgresql_task_lifecycle():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    schema = "verify_planner_"+uuid4().hex
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            try:
                await connection.execute(text(f'CREATE SCHEMA "{schema}"'))
                await connection.execute(text(f'SET LOCAL search_path TO "{schema}", public'))
                await connection.execution_options(schema_translate_map={None: schema})
                def migrate(sync_connection):
                    from alembic.migration import MigrationContext
                    from alembic.operations import Operations
                    files = ["20261022_83a2ff4d61d2_baseline_schema.py", "20261022_5f0581f9d75b_phase_36_people_schema.py",
                             "20261022_phase37_academic_organization.py", "20261022_d9b6e1315dd7_phase38_content_models.py",
                             "20261022_0b0d7ce2dcf3_make_subject_id_nullable.py", "20261023_21d890e192ab_phase39_practice_engine.py",
                             "20261023_phase41_personal_achievements.py", "20261023_phase42_academic_planner.py",
                             "20261023_phase42_planner_integrity.py"]
                    for index, filename in enumerate(files):
                        path = Path(__file__).parents[1]/"alembic/versions"/filename
                        spec = importlib.util.spec_from_file_location(f"planner_migration_{index}", path)
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        with Operations.context(MigrationContext.configure(sync_connection)):
                            module.upgrade()
                await connection.run_sync(migrate)
                async with AsyncSession(bind=connection, expire_on_commit=False) as session:
                    now = rules.now_utc()
                    institution = Institution(name="Fictional Planner A", timezone="America/Lima")
                    other = Institution(name="Fictional Planner B")
                    grade = Grade(number=4, name="4", display_name="4 primaria", sequence=1)
                    session.add_all([institution, other, grade])
                    await session.flush()
                    users = [User(institution_id=institution.id, display_name="Fictional "+str(i), status=UserStatus.ACTIVE) for i in range(4)]
                    outsider = User(institution_id=other.id, display_name="Fictional outsider", status=UserStatus.ACTIVE)
                    session.add_all([*users, outsider]); await session.flush()
                    monitor = MonitorProfile(user_id=users[0].id, employee_code="PL42-M")
                    students = [StudentProfile(user_id=users[i].id, student_code=f"PL42-{i}") for i in (1, 2)]
                    year = AcademicYear(institution_id=institution.id, year=2026, name="Year", start_date=(now-timedelta(days=30)).date(), end_date=(now+timedelta(days=30)).date(), status="active")
                    course = Course(institution_id=institution.id, grade_id=grade.id, code="PL42", name="Course", status="active")
                    session.add_all([monitor, *students, year, course]); await session.flush()
                    classroom = Classroom(institution_id=institution.id, academic_year_id=year.id, grade_id=grade.id, code="PL42", display_name="Class", status="active")
                    period = AcademicPeriod(academic_year_id=year.id, name="Period", period_type="bimester", sequence=1, status="active", start_date=year.start_date, end_date=year.end_date)
                    session.add_all([classroom, period]); await session.flush()
                    for student in students:
                        session.add(Enrollment(student_id=student.id, institution_id=institution.id, classroom_id=classroom.id, academic_year_id=year.id, status=EnrollmentStatus.ACTIVE))
                    session.add(TeacherAssignment(monitor_id=monitor.id, institution_id=institution.id, classroom_id=classroom.id, course_id=course.id, period_id=period.id, status="active"))
                    await session.flush()
                    teacher_codes = [rules.CREATE, rules.UPDATE, rules.PUBLISH, rules.REVIEW, rules.READ_SUBMISSIONS, "assignments.read_assigned", rules.CALENDAR_MANAGE]
                    def context(user, codes, inst=institution):
                        return AuthorizationContext(user_id=UUID(user.id), institution_id=UUID(inst.id), session_id=uuid4(), roles=[], permissions=codes)
                    teacher = context(users[0], teacher_codes)
                    student_context = context(users[1], [rules.READ, rules.SUBMIT, rules.CALENDAR_READ])
                    second_student = context(users[2], [rules.READ, rules.SUBMIT, rules.CALENDAR_READ])
                    foreign = context(outsider, teacher_codes, other)
                    unassigned = context(users[3], teacher_codes)
                    service = AssignmentService(session)
                    contexts = await service.access.teaching_contexts(teacher, page=1, page_size=25)
                    assert contexts["total"] == 1
                    assert contexts["items"][0]["classroom_id"] == classroom.id
                    assert (await service.access.teaching_contexts(unassigned, page=1, page_size=25))["total"] == 0
                    data = AssignmentCreate(course_id=course.id, classroom_id=classroom.id, academic_period_id=period.id,
                        title="Lectura de prueba", instructions="Lee y explica con tus palabras.", available_from=now-timedelta(hours=1), due_at=now+timedelta(days=2), allow_resubmission=True, max_attempts=2)
                    with pytest.raises(ForbiddenError):
                        await service.create(unassigned, data)
                    task = await service.create(teacher, data)
                    with pytest.raises(NotFoundError):
                        await service.own_task(student_context, task["id"])
                    published = await service.publish(teacher, task["id"], RevisionInput(expected_revision=1), "pub-42")
                    repeated = await service.publish(teacher, task["id"], RevisionInput(expected_revision=1), "pub-42")
                    assert repeated["assignment_version_id"] == published["assignment_version_id"]
                    assert (await session.execute(select(func.count()).select_from(AssignmentTarget))).scalar_one() == 2
                    assert (await session.execute(select(func.count()).select_from(AssignmentVersion))).scalar_one() == 1
                    with pytest.raises(ConflictError):
                        await service.publish(teacher, task["id"], RevisionInput(expected_revision=999), "pub-42")
                    with pytest.raises(ConflictError):
                        await service.update(teacher, task["id"], AssignmentUpdate(expected_revision=2, instructions="No sobrescribir"))
                    with pytest.raises(NotFoundError):
                        await service.teacher_task(foreign, task["id"], rules.UPDATE)
                    draft = await service.begin(student_context, task["id"], "begin-42")
                    assert (await service.begin(student_context, task["id"], "begin-42"))["id"] == draft["id"]
                    with pytest.raises(NotFoundError):
                        await service.get_submission(second_student, draft["id"])
                    saved = await service.save(student_context, draft["id"], SubmissionSave(expected_revision=1, response_text="Mi explicación."))
                    with pytest.raises(ConflictError):
                        await service.save(student_context, draft["id"], SubmissionSave(expected_revision=1, response_text="Vieja revisión"))
                    received = await service.submit(student_context, draft["id"], RevisionInput(expected_revision=2), "submit-42")
                    assert received["status"] == "submitted" and received["receipt"]["confirmation_reference"] == draft["id"]
                    assert (await service.submit(student_context, draft["id"], RevisionInput(expected_revision=2), "submit-42"))["submitted_at"] == received["submitted_at"]
                    with pytest.raises(ConflictError):
                        await service.save(student_context, draft["id"], SubmissionSave(expected_revision=3, response_text="Alteración"))
                    feedback = await service.feedback(teacher, draft["id"], FeedbackCreate(expected_revision=3, feedback_text="Agrega un ejemplo de la lectura.", requests_revision=True))
                    assert not (await service.get_submission(student_context, draft["id"]))["feedback"]
                    await service.publish_feedback(teacher, feedback["id"], RevisionInput(expected_revision=4))
                    assert len((await service.get_submission(student_context, draft["id"]))["feedback"]) == 1
                    revised = await service.begin(student_context, task["id"], "resubmit-42", previous_id=draft["id"])
                    assert revised["previous_submission_id"] == draft["id"] and revised["attempt_number"] == 2
                    assert (await service.get_submission(student_context, draft["id"]))["response_text"] == "Mi explicación."
                    with pytest.raises(ConflictError):
                        await service.feedback(teacher, draft["id"], FeedbackCreate(expected_revision=5,
                            feedback_text="No alterar el intento anterior"))
                    target = await service.repo.target(task["id"], students[0].id)
                    extended = await service.extend(teacher, target.id, ExtensionInput(expected_revision=1, due_at=now+timedelta(days=3), reason="Ajuste de plazo"))
                    assert extended["revision"] == 2
                    event_admin = context(users[3], [rules.CALENDAR_INSTITUTION])
                    event = await CalendarService(session).create(event_admin, CalendarCreate(title="Día de lectura", scope="institution", all_day=True, starts_on=now.date(), ends_on=now.date()+timedelta(days=1)))
                    calendar = await CalendarService(session).personal(student_context, now.date()-timedelta(days=1), now.date()+timedelta(days=5), page=1, page_size=25)
                    assert calendar["total"] == 2
                    assert {x["source"] for x in calendar["items"]} == {"calendar_event", "assignment"}
                    assert next(x for x in calendar["items"] if x["all_day"])["starts_on"] == now.date()
                    assert calendar["assessments"]["data_status"] == "not_available"
                    with pytest.raises(NotFoundError):
                        await CalendarService(session).change(foreign, event["id"], RevisionInput(expected_revision=1), cancel=True)
                    classroom_event = await CalendarService(session).create(teacher, CalendarCreate(
                        title="Encuentro de aula", scope="classroom", classroom_id=classroom.id,
                        starts_at=now, ends_at=now+timedelta(hours=1)))
                    assert (await CalendarService(session).get(student_context, classroom_event["id"]))["id"] == classroom_event["id"]
                    enrollment = (await session.execute(select(Enrollment).where(Enrollment.student_id == students[0].id))).scalars().one()
                    enrollment.effective_date = now+timedelta(days=1)
                    await session.flush()
                    with pytest.raises(NotFoundError):
                        await CalendarService(session).get(student_context, classroom_event["id"])
                    enrollment.effective_date = None
                    await session.flush()
                    individual = await service.create(teacher, data.model_copy(update={"title": "Actividad individual", "student_ids": [UUID(students[0].id)]}))
                    await service.publish(teacher, individual["id"], RevisionInput(expected_revision=1), "publish-individual")
                    individual_target = await service.repo.target(individual["id"], students[0].id)
                    # A mismatched task version is rejected by PostgreSQL, not only services.
                    with pytest.raises(IntegrityError):
                        async with session.begin_nested():
                            session.add(AssignmentSubmission(assignment_id=individual["id"], target_id=individual_target.id,
                                assignment_version_id=published["assignment_version_id"], response_text="Fictitious mismatch"))
                            await session.flush()
                    with pytest.raises(NotFoundError):
                        await service.own_task(second_student, individual["id"])
                    from app.services.planner_summary_service import PlannerSummaryService
                    with pytest.raises(ForbiddenError):
                        await PlannerSummaryService(session).institution(teacher)
                    aggregate = await PlannerSummaryService(session).institution(context(users[3], ["planner.read_institution_aggregates"]))
                    assert aggregate["published_assignments_count"] == 2
                    assert aggregate["received_recipient_assignments_count"] == 1
                    from app.db.models import Unit, Lesson, ContentVersion, ContentReview, ContentPublication
                    from app.schemas.planner import ReinforcementCreate
                    from app.services.reinforcement_service import ReinforcementService
                    unit = Unit(course_id=course.id, title="Repaso", sequence=1)
                    session.add(unit); await session.flush()
                    lesson = Lesson(unit_id=unit.id, title="Lectura de repaso", sequence=1, status="published")
                    session.add(lesson); await session.flush()
                    content_version = ContentVersion(content_id=lesson.id, content_type="lesson", version="1", version_number=1,
                        author_id=users[0].id, status="published", is_published=True,
                        snapshot={"title": lesson.title}, validation_result={"is_valid": True})
                    session.add(content_version); await session.flush()
                    review = ContentReview(content_version_id=content_version.id, reviewer_user_id=users[3].id,
                        institution_id=institution.id, status="approved")
                    session.add(review); await session.flush()
                    session.add(ContentPublication(content_version_id=content_version.id, institution_id=institution.id,
                        published_by_user_id=users[3].id, review_id=review.id, status="published"))
                    await session.flush()
                    reinforcement_teacher = teacher.model_copy(update={"permissions": [*teacher.permissions, "reinforcement.manage"]})
                    reinforcement_student = student_context.model_copy(update={"permissions": [*student_context.permissions, "reinforcement.read_own"]})
                    plan_service = ReinforcementService(session)
                    plan = await plan_service.create(reinforcement_teacher, ReinforcementCreate(course_id=course.id,
                        classroom_id=classroom.id, student_id=students[0].id, academic_period_id=period.id,
                        title="Repaso acompañado", objective="Explicar una lectura", instructions="Lee y explica.",
                        lesson_ids=[lesson.id], available_from=now-timedelta(hours=1), due_at=now+timedelta(days=1)))
                    with pytest.raises(NotFoundError):
                        await plan_service.read(reinforcement_student, plan["id"])
                    for action, actor, revision in [("assign", reinforcement_teacher, 1), ("start", reinforcement_student, 2),
                        ("complete", reinforcement_student, 3), ("review", reinforcement_teacher, 4)]:
                        plan = await plan_service.transition(actor, plan["id"], RevisionInput(expected_revision=revision), action)
                    assert plan["status"] == "reviewed"
                    assert (await plan_service.read(reinforcement_student, plan["id"]))["status"] == "reviewed"
                    with pytest.raises(NotFoundError):
                        await plan_service.read(second_student.model_copy(update={"permissions": ["reinforcement.read_own"]}), plan["id"])
                    # Real HTTP routing and schema validation over the isolated database.
                    from httpx import ASGITransport, AsyncClient
                    from app.main import create_app
                    from app.api.v1.endpoints.planner import planner_database
                    from app.dependencies.auth import get_authorization_context
                    app = create_app()
                    async def database_override():
                        yield session
                    app.dependency_overrides[planner_database] = database_override
                    app.dependency_overrides[get_authorization_context] = lambda: student_context
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.get("/api/v1/assignments/me")
                        assert response.status_code == 200 and response.json()["total"] == 2
                        assert response.headers["cache-control"] == "private, no-store"
                        assert (await client.get("/api/v1/planner-summary/institution")).status_code == 403
                        assert (await client.get("/api/v1/academic-calendar/me?start=2026-10-01&end=2027-10-01")).status_code == 422
                        assert (await client.patch(f"/api/v1/assignment-submissions/{revised['id']}", json={"expected_revision": 1, "response_text": "Respuesta", "reviewed": True})).status_code == 422
                        assert (await client.get("/api/v1/assignments/me?page_size=101")).status_code == 422
                    app.dependency_overrides.clear()
                    await CalendarService(session).change(event_admin, event["id"], RevisionInput(expected_revision=1), cancel=True)
                    assert (await session.execute(select(func.count()).select_from(AssignmentSubmission))).scalar_one() == 2
                    assert (await session.execute(select(func.count()).select_from(PlannerAudit))).scalar_one() >= 7
                    await service.close(teacher, task["id"], RevisionInput(expected_revision=2))
                    with pytest.raises(ConflictError):
                        await service.save(student_context, revised["id"], SubmissionSave(expected_revision=1, response_text="Cerrada"))
                    archived = await service.archive(teacher, task["id"], RevisionInput(expected_revision=3))
                    assert archived["status"] == "archived"
                    assert (await service.get_submission(student_context, draft["id"]))["response_text"] == "Mi explicación."
                    # No academic records/results are written by planner.
                    from app.db.models import AssessmentResult
                    assert (await session.execute(select(func.count()).select_from(AssessmentResult))).scalar_one() == 0
            finally:
                await transaction.rollback()
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_planner_database_failure_is_503_without_sql_details(monkeypatch):
    from sqlalchemy.exc import SQLAlchemyError
    from httpx import ASGITransport, AsyncClient
    from app.api.v1.endpoints import planner
    from app.dependencies.auth import get_authorization_context
    from app.main import create_app

    class UnavailableSession:
        rolled_back = False

        async def execute(self, *args, **kwargs):
            raise SQLAlchemyError("PRIVATE_SQL_OR_DATABASE_DETAILS")

        async def rollback(self):
            self.rolled_back = True

    session = UnavailableSession()
    async def dependency():
        yield session
    monkeypatch.setattr(planner, "get_async_session_dependency", dependency)
    app = create_app()
    app.dependency_overrides[get_authorization_context] = lambda: AuthorizationContext(
        user_id=uuid4(), institution_id=uuid4(), session_id=uuid4(), roles=[], permissions=["assignments.read_assigned"])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/assignments")
        assert response.status_code == 503
        assert "PRIVATE_SQL" not in response.text
        assert session.rolled_back
    app.dependency_overrides.clear()
