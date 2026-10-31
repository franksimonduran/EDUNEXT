"""Reports with fictional isolated PostgreSQL data and real source services."""

import csv
import importlib.util
import io
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import (Base, AcademicYear, AcademicPeriod, Classroom, ContentVersion, ContentReview, ContentPublication,
    Course, Enrollment, EnrollmentStatus, Grade, Institution, Lesson, MonitorProfile, StudentProfile, TeacherAssignment, Unit, User, UserStatus)
from app.db.models.report_access import ReportAccessEvent
from app.schemas.permission import AuthorizationContext
from app.schemas.planner import AssignmentCreate, RevisionInput, SubmissionSave, FeedbackCreate
from app.schemas.report import ReportFilters
from app.services.assignment_service import AssignmentService
from app.services.progress_service import ProgressService
from app.services.report_service import ReportService
from app.services.planner_summary_service import PlannerSummaryService
from app.exporters.csv_exporter import export_csv, safe_cell


@pytest_asyncio.fixture
async def data():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    schema = "verify_reports_"+uuid4().hex
    try:
        async with engine.connect() as connection:
            tx = await connection.begin()
            try:
                await connection.execute(text(f'CREATE SCHEMA "{schema}"'))
                await connection.execute(text(f'SET LOCAL search_path TO "{schema}", public'))
                await connection.execution_options(schema_translate_map={None: schema})
                def prepare(sync):
                    from alembic.migration import MigrationContext
                    from alembic.operations import Operations
                    Base.metadata.create_all(sync, tables=[t for t in Base.metadata.sorted_tables if t.name not in {
                        "report_access_events", "ai_service_configurations", "ai_usage_events", "ai_pronunciation_sessions"}])
                    spec = importlib.util.spec_from_file_location("reports_migration", Path(__file__).parents[1]/"alembic/versions/20261023_phase43_reports.py")
                    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
                    with Operations.context(MigrationContext.configure(sync)):
                        module.upgrade()
                await connection.run_sync(prepare)
                async with AsyncSession(bind=connection, expire_on_commit=False) as session:
                    now = datetime.now(timezone.utc)
                    a, b = Institution(name="Fictional Reports A", timezone="America/Lima"), Institution(name="Fictional Reports B")
                    grade = Grade(number=4, name="4", display_name="Cuarto", sequence=1)
                    session.add_all([a,b,grade]); await session.flush()
                    users = [User(institution_id=a.id, display_name=f"Fictional report {i}", status=UserStatus.ACTIVE) for i in range(8)]
                    outsider = User(institution_id=b.id, display_name="Fictional outsider", status=UserStatus.ACTIVE)
                    session.add_all([*users,outsider]); await session.flush()
                    students = [StudentProfile(user_id=user.id, student_code=f"R43-{i}") for i,user in enumerate(users[:6])]
                    monitor = MonitorProfile(user_id=users[6].id, employee_code="R43-M")
                    year = AcademicYear(institution_id=a.id, year=2026, name="Fictional year", status="active",
                        start_date=(now-timedelta(days=30)).date(), end_date=(now+timedelta(days=30)).date())
                    course = Course(institution_id=a.id, grade_id=grade.id, code="R43", name="Lectura", status="active")
                    session.add_all([*students,monitor,year,course]); await session.flush()
                    room = Classroom(institution_id=a.id, academic_year_id=year.id, grade_id=grade.id, code="R43", display_name="Fictional classroom", status="active")
                    period = AcademicPeriod(academic_year_id=year.id, name="Periodo", period_type="bimester", sequence=1,
                        start_date=year.start_date,end_date=year.end_date,status="active")
                    session.add_all([room,period]); await session.flush()
                    enrollments = [Enrollment(student_id=s.id, institution_id=a.id, classroom_id=room.id, academic_year_id=year.id,
                        status=EnrollmentStatus.ACTIVE, effective_date=now-timedelta(days=20), enrolled_at=now-timedelta(days=20)) for s in students]
                    session.add_all(enrollments)
                    session.add(TeacherAssignment(monitor_id=monitor.id,institution_id=a.id,classroom_id=room.id,
                        course_id=course.id,period_id=period.id,status="active"))
                    unit = Unit(course_id=course.id,title="Lectura",sequence=1)
                    session.add(unit); await session.flush()
                    lesson = Lesson(unit_id=unit.id,title="Lectura publicada",sequence=1,status="published")
                    session.add(lesson); await session.flush()
                    version = ContentVersion(content_id=lesson.id,content_type="lesson",version="1",version_number=1,
                        author_id=users[6].id,status="published",is_published=True,snapshot={"title":lesson.title},validation_result={"is_valid":True})
                    session.add(version); await session.flush()
                    review = ContentReview(content_version_id=version.id,reviewer_user_id=users[7].id,institution_id=a.id,status="approved")
                    session.add(review); await session.flush()
                    session.add(ContentPublication(content_version_id=version.id,institution_id=a.id,published_by_user_id=users[7].id,review_id=review.id,status="published"))
                    await session.flush()
                    def ctx(user,permissions,inst=a):
                        return AuthorizationContext(user_id=UUID(user.id),institution_id=UUID(inst.id),session_id=uuid4(),roles=[],permissions=permissions)
                    pupil = ctx(users[0],["reports.read_own","reports.export_own","progress.read_own","progress.record_own_activity",
                        "assignments.read_own","submissions.create_own"])
                    teacher = ctx(users[6],["reports.read_assigned","reports.export_assigned","progress.read_assigned",
                        "assignments.create_assigned","assignments.publish_assigned","submissions.read_assigned","submissions.review_assigned"])
                    admin = ctx(users[7],["reports.read_institution_aggregates","reports.export_institution_aggregates"])
                    task = await AssignmentService(session).create(teacher, AssignmentCreate(course_id=course.id,classroom_id=room.id,
                        academic_period_id=period.id,title="=Prueba de CSV",instructions="Lee y explica.",available_from=now-timedelta(hours=1),due_at=now+timedelta(days=2),allow_resubmission=True,max_attempts=2))
                    await AssignmentService(session).publish(teacher,task["id"],RevisionInput(expected_revision=1),"reports-publish")
                    await ProgressService(session).record(pupil,lesson.id,version.id,complete=True)
                    yield SimpleNamespace(session=session,now=now,a=a,b=b,users=users,outsider=outsider,students=students,
                        enrollments=enrollments,year=year,period=period,course=course,room=room,lesson=lesson,task=task,
                        pupil=pupil,teacher=teacher,admin=admin,ctx=ctx)
            finally:
                await tx.rollback()
    finally:
        await engine.dispose()


@pytest.mark.parametrize("value",["=1+1","+SUM(A1)","-cmd","@SUM(A1)","\t=1"," \r\n=1","\ufeff=1"])
def test_csv_injection(value):
    assert safe_cell(value).startswith("'")


def test_csv_preserves_real_numbers_and_unicode():
    assert safe_cell(-12.5) == -12.5
    assert safe_cell("Perú, lectura") == "Perú, lectura"


async def test_catalog_and_own_progress_matches_source(data):
    service = ReportService(data.session)
    catalog = await service.catalog(data.pupil)
    assert all(row["code"].startswith("me.") for row in catalog)
    report = await service.generate(data.pupil,"me.overview",ReportFilters())
    values = {m.id:m.value for m in report.metrics}
    source = await ProgressService(data.session).overview(data.pupil)
    assert values["completion_percentage"] == source.completion_percentage == 100
    assert values["completed_lessons_count"] == 1
    assert report.metadata.data_status == "partial"
    unavailable = await service.generate(data.pupil,"me.competencies",ReportFilters())
    assert unavailable.metadata.data_status == "source_not_available" and not unavailable.metrics
    with pytest.raises(ValidationError):
        await service.generate(data.pupil,"me.courses",ReportFilters(cutoff=data.now))


async def test_own_isolation_and_disabled_user(data):
    other = data.ctx(data.users[1],data.pupil.permissions)
    report = await ReportService(data.session).generate(other,"me.courses",ReportFilters())
    assert report.rows[0]["completed_lessons_count"] == 0
    data.users[0].status = UserStatus.INACTIVE
    await data.session.flush()
    with pytest.raises(ForbiddenError):
        await ReportService(data.session).generate(data.pupil,"me.courses",ReportFilters())


async def test_monitor_assignments_match_planner_and_resubmission(data):
    assignment = AssignmentService(data.session)
    draft = await assignment.begin(data.pupil,data.task["id"],"begin-report")
    await assignment.save(data.pupil,draft["id"],SubmissionSave(expected_revision=1,response_text="Mi lectura."))
    await assignment.submit(data.pupil,draft["id"],RevisionInput(expected_revision=2),"submit-report")
    filters = ReportFilters(classroom_id=data.room.id,course_id=data.course.id,academic_period_id=data.period.id)
    service = ReportService(data.session)
    report = await service.generate(data.teacher,"monitor.assignments",filters)
    row = report.rows[0]
    source = await PlannerSummaryService(data.session).recipient_counts(data.teacher,task_id=data.task["id"])
    assert row["recipients_count"] == source["recipients_count"] == 6
    assert row["received_count"] == source["received_count"] == 1
    assert row["submission_percentage"] == 16.67
    feedback = await assignment.feedback(data.teacher,draft["id"],FeedbackCreate(expected_revision=3,feedback_text="Agrega un ejemplo.",requests_revision=True))
    await assignment.publish_feedback(data.teacher,feedback["id"],RevisionInput(expected_revision=4))
    await assignment.begin(data.pupil,data.task["id"],"correct-report",previous_id=draft["id"])
    report = await service.generate(data.teacher,"monitor.assignments",filters)
    assert report.rows[0]["received_count"] == 0
    assert report.rows[0]["recipients_count"] == 6
    with pytest.raises(ForbiddenError):
        await service.generate(data.ctx(data.users[7],data.teacher.permissions),"monitor.assignments",filters)


async def test_institution_cutoff_and_transfer_uniqueness(data):
    report = await ReportService(data.session).generate(data.admin,"institution.enrollments",ReportFilters(academic_year_id=data.year.id))
    assert report.metrics[0].value == 6
    previous = data.enrollments[0]
    previous.status = EnrollmentStatus.TRANSFERRED; previous.ended_at=data.now-timedelta(days=1)
    await data.session.flush()
    data.session.add(Enrollment(student_id=data.students[0].id,institution_id=data.a.id,classroom_id=data.room.id,
        academic_year_id=data.year.id,status=EnrollmentStatus.ACTIVE,effective_date=data.now-timedelta(days=1)))
    await data.session.flush()
    service = ReportService(data.session)
    for cutoff in (data.now-timedelta(days=2),data.now):
        result = await service.generate(data.admin,"institution.enrollments",ReportFilters(academic_year_id=data.year.id,cutoff=cutoff))
        assert result.metrics[0].value == 6
    previous.ended_at = None
    await data.session.flush()
    result = await service.generate(data.admin,"institution.enrollments",ReportFilters(academic_year_id=data.year.id))
    assert result.metadata.data_status == "partial"


async def test_small_groups_and_complementary_totals(data):
    for enrollment in data.enrollments[1:]:
        enrollment.status=EnrollmentStatus.WITHDRAWN; enrollment.ended_at=data.now-timedelta(hours=1)
    await data.session.flush()
    result = await ReportService(data.session).generate(data.admin,"institution.enrollments",ReportFilters())
    assert result.metadata.data_status == "suppressed_small_cohort"
    assert result.metrics[0].value is None and result.total is None and result.rows == []
    with pytest.raises(ValidationError):
        await ReportService(data.session).generate(data.admin,"institution.enrollments",ReportFilters(classroom_id=data.room.id))
    grade = Grade(number=5,name="5",display_name="Quinto",sequence=2)
    data.session.add(grade); await data.session.flush()
    room = Classroom(institution_id=data.a.id,academic_year_id=data.year.id,grade_id=grade.id,code="R43-5",display_name="Fifth")
    data.session.add(room); await data.session.flush()
    for e in data.enrollments[1:]:
        e.status=EnrollmentStatus.ACTIVE;e.ended_at=None
    data.enrollments[0].classroom_id=room.id
    await data.session.flush()
    result = await ReportService(data.session).generate(data.admin,"institution.enrollments",ReportFilters())
    assert result.metadata.data_status == "suppressed_small_cohort" and not result.rows and result.total is None


async def test_foreign_institution_and_export_access(data):
    service = ReportService(data.session)
    foreign = data.ctx(data.outsider,data.admin.permissions,data.b)
    with pytest.raises(NotFoundError):
        await service.generate(foreign,"institution.enrollments",ReportFilters(academic_year_id=data.year.id))
    with pytest.raises(ForbiddenError):
        await service.generate(data.pupil,"institution.enrollments",ReportFilters())
    no_export = data.pupil.model_copy(update={"permissions":[p for p in data.pupil.permissions if p!="reports.export_own"]})
    with pytest.raises(ForbiddenError):
        await service.generate(no_export,"me.courses",ReportFilters(),exporting=True)
    report = await service.generate(data.pupil,"me.activities",ReportFilters(),exporting=True)
    parsed=list(csv.reader(io.StringIO(export_csv(report).decode("utf-8-sig"))))
    assert any("'=Prueba de CSV" in row for row in parsed)
    assert any("official_document" in row and "False" in row for row in parsed)
    await data.session.flush()
    assert (await data.session.execute(select(func.count()).select_from(ReportAccessEvent))).scalar_one() == 1


async def test_report_http_filters_pagination_and_export(data):
    from app.main import create_app
    from app.dependencies.auth import get_authorization_context
    from app.api.v1.endpoints.reports import report_database
    app=create_app()
    async def db():
        yield data.session
    app.dependency_overrides[report_database]=db
    app.dependency_overrides[get_authorization_context]=lambda:data.pupil
    async with AsyncClient(transport=ASGITransport(app=app),base_url="http://test") as client:
        response=await client.get("/api/v1/reports/me/courses")
        assert response.status_code==200,response.text
        assert response.headers["cache-control"]=="private, no-store"
        assert response.json()["total"]==1
        assert (await client.get("/api/v1/reports/me/courses?page=2")).json()["rows"]==[]
        for query in ("student_id="+data.students[1].id,"institution_id="+data.b.id,"page_size=101","page=1&page=2","cutoff=2026-10-23T00:00:00"):
            assert (await client.get("/api/v1/reports/me/courses?"+query)).status_code==422
        assert (await client.get("/api/v1/reports/unknown/sql")).status_code==404
        response=await client.post("/api/v1/reports/exports",json={"report_code":"me.courses","format":"csv"})
        assert response.status_code==200,response.text
        assert "attachment" in response.headers["content-disposition"]
        assert response.content.startswith(b"\xef\xbb\xbf")
        assert (await client.post("/api/v1/reports/exports",json={"report_code":"me.courses","format":"pdf"})).status_code==422
    app.dependency_overrides.clear()


async def test_history_content_sources_and_empty_population(data):
    service=ReportService(data.session)
    history=await service.generate(data.pupil,"me.history",ReportFilters())
    assert history.total==2 and {r["event_type"] for r in history.rows}=={"lesson_started","lesson_completed"}
    courses=await service.generate(data.admin,"institution.courses",ReportFilters())
    assert courses.rows[0]["published_applicable_lessons_count"]==1
    data.lesson.status="draft"
    await data.session.flush()
    assert (await service.generate(data.admin,"institution.courses",ReportFilters())).rows[0]["published_applicable_lessons_count"]==0
    foreign=data.ctx(data.outsider,data.admin.permissions,data.b)
    empty=await service.generate(foreign,"institution.enrollments",ReportFilters())
    assert empty.metadata.data_status=="no_applicable_records" and empty.metrics[0].value==0


async def test_timezone_cutoff_and_future_rejection(data):
    cutoff=data.now-timedelta(days=2)
    one=data.enrollments[0]
    one.effective_date=cutoff+timedelta(minutes=1)
    await data.session.flush()
    service=ReportService(data.session)
    result=await service.generate(data.admin,"institution.enrollments",ReportFilters(cutoff=cutoff.astimezone(timezone(timedelta(hours=-5)))))
    assert result.metrics[0].value==5
    with pytest.raises(ValidationError):
        await service.generate(data.admin,"institution.enrollments",ReportFilters(cutoff=data.now+timedelta(days=1)))
    from app.db.models import LearningProgress
    fact=(await data.session.execute(select(LearningProgress))).scalars().one()
    fact.started_at=datetime(2026,10,23,1,tzinfo=timezone.utc)
    fact.completed_at=datetime(2026,10,23,2,tzinfo=timezone.utc)
    await data.session.flush()
    series=await service.generate(data.pupil,"me.activity_series",ReportFilters(
        since=datetime(2026,10,22,tzinfo=timezone.utc),until=datetime(2026,10,24,tzinfo=timezone.utc)))
    assert str(series.rows[0]["occurred_on"])=="2026-10-22"
    assert series.rows[0]["lesson_completions_occurred_count"]==1


async def test_query_budget_and_timing(data):
    import time
    from sqlalchemy import event
    statements=[]
    connection=data.session.bind.sync_connection
    def before(*args):
        statements.append(args[2])
    event.listen(connection,"before_cursor_execute",before)
    try:
        start=time.perf_counter()
        result=await ReportService(data.session).generate(data.teacher,"monitor.assignments",
            ReportFilters(classroom_id=data.room.id,course_id=data.course.id))
        elapsed=(time.perf_counter()-start)*1000
    finally:
        event.remove(connection,"before_cursor_execute",before)
    assert result.total==1 and len(statements)<=10
    print(f"REPORT_PERFORMANCE recipients=6 tasks=1 rows={len(result.rows)} SQL={len(statements)} elapsed_ms={elapsed:.2f}")


async def test_report_database_failure_is_503(monkeypatch):
    from sqlalchemy.exc import SQLAlchemyError
    from app.api.v1.endpoints import reports
    from app.dependencies.auth import get_authorization_context
    from app.main import create_app
    class Broken:
        rolled_back=False
        async def connection(self,**kwargs):
            raise SQLAlchemyError("PRIVATE DATABASE DETAILS")
        async def rollback(self):
            self.rolled_back=True
    broken=Broken()
    async def db():
        yield broken
    monkeypatch.setattr(reports,"get_async_session_dependency",db)
    app=create_app()
    app.dependency_overrides[get_authorization_context]=lambda:AuthorizationContext(
        user_id=uuid4(),institution_id=uuid4(),session_id=uuid4(),roles=[],permissions=["reports.read_own"])
    async with AsyncClient(transport=ASGITransport(app=app),base_url="http://localhost") as client:
        response=await client.get("/api/v1/reports/catalog")
        assert response.status_code==503 and "PRIVATE" not in response.text and broken.rolled_back
    app.dependency_overrides.clear()


async def test_export_row_limit_and_source_immutability(data):
    from app.db.models.planner import AssignmentSubmission
    before=(await data.session.execute(select(func.count()).select_from(AssignmentSubmission))).scalar_one()
    for index in range(101):
        data.session.add(Course(institution_id=data.a.id,grade_id=data.course.grade_id,code=f"R43-LIMIT-{index}",name=f"Fictional course {index}",status="active"))
    await data.session.flush()
    with pytest.raises(ConflictError):
        await ReportService(data.session).generate(data.admin,"institution.courses",ReportFilters(),exporting=True)
    assert (await data.session.execute(select(func.count()).select_from(AssignmentSubmission))).scalar_one()==before
    assert data.task["instructions"]=="Lee y explica."


async def test_two_populated_institutions_do_not_mix(data):
    year=AcademicYear(institution_id=data.b.id,year=2026,name="Fictional B year",status="active",
        start_date=data.year.start_date,end_date=data.year.end_date)
    course=Course(institution_id=data.b.id,grade_id=data.course.grade_id,code="R43-B",name="Fictional B course",status="active")
    data.session.add_all([year,course]);await data.session.flush()
    room=Classroom(institution_id=data.b.id,academic_year_id=year.id,grade_id=data.course.grade_id,code="R43-B",display_name="Fictional B room",status="active")
    data.session.add(room);await data.session.flush()
    for i in range(5):
        user=User(institution_id=data.b.id,display_name=f"Fictional B student {i}",status=UserStatus.ACTIVE)
        data.session.add(user);await data.session.flush()
        profile=StudentProfile(user_id=user.id,student_code=f"R43-B-{i}")
        data.session.add(profile);await data.session.flush()
        data.session.add(Enrollment(student_id=profile.id,institution_id=data.b.id,classroom_id=room.id,
            academic_year_id=year.id,status=EnrollmentStatus.ACTIVE,effective_date=data.now-timedelta(days=10)))
    await data.session.flush()
    service=ReportService(data.session)
    a=await service.generate(data.admin,"institution.enrollments",ReportFilters())
    bctx=data.ctx(data.outsider,data.admin.permissions,data.b)
    b=await service.generate(bctx,"institution.enrollments",ReportFilters())
    assert a.metrics[0].value==6 and b.metrics[0].value==5
    with pytest.raises(NotFoundError):
        await service.generate(data.pupil,"me.courses",ReportFilters(course_id=course.id))
    with pytest.raises(NotFoundError):
        await service.generate(data.teacher,"monitor.assignments",ReportFilters(classroom_id=room.id,course_id=course.id))
