"""Progress verification in a transaction-local, fictional PostgreSQL schema."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.db.models import (
    AcademicYear, Base, Classroom, ContentPublication, ContentReview, ContentVersion,
    Course, Enrollment, EnrollmentStatus, Grade, Institution, LearningProgress,
    Lesson, MonitorProfile, StudentProfile, TeacherAssignment, Unit, User, UserStatus,
)
from app.db.models.content_workflow import ContentPublicationStatus, ContentReviewStatus
from app.db.models.student_achievement import StudentAchievement
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.progress_calculator import catalog_reference, completion_percentage
from app.services.progress_service import ProgressService, RECORD_PERMISSION


@pytest.mark.parametrize("completed,total,expected", [(0, 0, None), (0, 8, 0), (5, 8, 62.5), (1, 3, 33.33), (15, 15, 100)])
def test_completion_denominators(completed, total, expected):
    assert completion_percentage(completed, total) == expected


def test_catalog_reference_stable_under_reorder_and_changes_on_version():
    assert catalog_reference([("a", "1"), ("b", "1")]) == catalog_reference([("b", "1"), ("a", "1")])
    assert catalog_reference([("a", "1")]) != catalog_reference([("a", "2")])


@pytest.mark.asyncio
async def test_postgresql_progress_lifecycle_and_api():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    schema = "verify_progress_" + uuid4().hex
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            try:
                await connection.execute(text(f'CREATE SCHEMA "{schema}"'))
                await connection.execute(text(f'SET LOCAL search_path TO "{schema}", public'))
                await connection.execution_options(schema_translate_map={None: schema})
                # Exercise the actual additive migration, not just metadata creation.
                def prepare(sync_connection):
                    import importlib.util
                    from pathlib import Path
                    from alembic.migration import MigrationContext
                    from alembic.operations import Operations
                    Base.metadata.create_all(sync_connection, tables=[t for t in Base.metadata.sorted_tables if t.name != "student_achievements"])
                    path = Path(__file__).parents[1] / "alembic/versions/20261023_phase41_personal_achievements.py"
                    spec = importlib.util.spec_from_file_location("phase41_migration", path)
                    migration = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(migration)
                    with Operations.context(MigrationContext.configure(sync_connection)):
                        migration.upgrade()
                await connection.run_sync(prepare)
                async with AsyncSession(bind=connection, expire_on_commit=False) as session:
                    now = datetime.now(timezone.utc)
                    institution = Institution(name="Fictional Progress A", status="active")
                    other_institution = Institution(name="Fictional Progress B", status="active")
                    grade = Grade(number=4, name="4", display_name="4 primaria", sequence=1)
                    session.add_all([institution, other_institution, grade])
                    await session.flush()
                    student_user = User(institution_id=institution.id, display_name="Fictional Student", status=UserStatus.ACTIVE)
                    author = User(institution_id=institution.id, display_name="Fictional Author", status=UserStatus.ACTIVE)
                    reviewer = User(institution_id=institution.id, display_name="Fictional Reviewer", status=UserStatus.ACTIVE)
                    outsider = User(institution_id=other_institution.id, display_name="Fictional Outsider", status=UserStatus.ACTIVE)
                    session.add_all([student_user, author, reviewer, outsider])
                    await session.flush()
                    student = StudentProfile(user_id=student_user.id, student_code="P41-TEST")
                    outsider_profile = StudentProfile(user_id=outsider.id, student_code="P41-OTHER")
                    monitor = MonitorProfile(user_id=author.id, employee_code="P41-MON")
                    year = AcademicYear(institution_id=institution.id, year=2026, name="Test Year", start_date=(now-timedelta(days=30)).date(), end_date=(now+timedelta(days=30)).date(), status="active")
                    course = Course(institution_id=institution.id, grade_id=grade.id, code="P41", name="Fictional Course", status="active")
                    session.add_all([student, outsider_profile, monitor, year, course])
                    await session.flush()
                    classroom = Classroom(institution_id=institution.id, academic_year_id=year.id, grade_id=grade.id, code="P41", display_name="Fictional Classroom", status="active")
                    unit = Unit(course_id=course.id, title="Unit", sequence=1)
                    empty_unit = Unit(course_id=course.id, title="Empty Unit", sequence=2)
                    session.add_all([classroom, unit, empty_unit])
                    await session.flush()
                    enrollment = Enrollment(student_id=student.id, institution_id=institution.id, classroom_id=classroom.id, academic_year_id=year.id, status=EnrollmentStatus.ACTIVE)
                    assignment = TeacherAssignment(monitor_id=monitor.id, institution_id=institution.id, classroom_id=classroom.id, course_id=course.id, status="active")
                    session.add_all([enrollment, assignment])
                    pairs = []
                    for index in range(6):
                        lesson = Lesson(unit_id=unit.id, title=f"Lesson {index}", sequence=index, status="published")
                        session.add(lesson)
                        await session.flush()
                        version = ContentVersion(content_id=lesson.id, content_type="lesson", version="1", version_number=1, author_id=author.id,
                            status="published", is_published=True, snapshot={"title": lesson.title}, validation_result={"is_valid": True})
                        session.add(version)
                        await session.flush()
                        review = ContentReview(content_version_id=version.id, reviewer_user_id=reviewer.id, institution_id=institution.id, status=ContentReviewStatus.APPROVED)
                        session.add(review)
                        await session.flush()
                        publication = ContentPublication(content_version_id=version.id, institution_id=institution.id, published_by_user_id=reviewer.id, review_id=review.id, status=ContentPublicationStatus.PUBLISHED)
                        session.add(publication)
                        pairs.append((lesson, version, publication))
                    draft = Lesson(unit_id=unit.id, title="Draft excluded", sequence=7)
                    session.add(draft)
                    await session.flush()
                    context = AuthorizationContext(user_id=UUID(student_user.id), institution_id=UUID(institution.id), roles=["STUDENT"], permissions=[Permissions.PROGRESS_READ_OWN, RECORD_PERMISSION], session_id=uuid4())
                    service = ProgressService(session)
                    assert (await service.overview(context)).applicable_lessons_count == 6
                    # A stale publication must not make a draft lesson applicable.
                    pairs[5][0].status = "draft"
                    await session.flush()
                    assert (await service.overview(context)).applicable_lessons_count == 5
                    with pytest.raises(NotFoundError):
                        await service.record(context, pairs[5][0].id, pairs[5][1].id, complete=True)
                    pairs[5][0].status = "published"
                    await session.flush()
                    pairs[5][1].validation_result = {"is_valid": False}
                    await session.flush()
                    assert (await service.overview(context)).applicable_lessons_count == 5
                    with pytest.raises(NotFoundError):
                        await service.record(context, pairs[5][0].id, pairs[5][1].id, complete=True)
                    pairs[5][1].validation_result = {"is_valid": True}
                    await session.flush()
                    assert (await service.unit(context, empty_unit.id))["completion_percentage"] is None
                    lesson, version, publication = pairs[0]
                    started = await service.record(context, lesson.id, version.id, complete=False)
                    assert started.status == "started"
                    assert not any(a.earned_at for a in await service.achievements(context))
                    first = await service.record(context, lesson.id, version.id, complete=True)
                    repeat = await service.record(context, lesson.id, version.id, complete=True)
                    assert first.completed_at == repeat.completed_at
                    assert first.started_at is not None
                    assert str(first.completed_lesson_version_id) == version.id
                    assert (await service.overview(context)).last_confirmed_activity_at == first.completed_at
                    assert (await service.unit(context, unit.id))["started_lessons_count"] == 0
                    assert (await service.record(context, lesson.id, version.id, complete=False)).status == "completed"
                    assert (await service.overview(context)).completion_percentage == 16.67
                    assert len([a for a in await service.achievements(context) if a.earned_at]) == 1
                    for other_lesson, other_version, _ in pairs[1:5]:
                        await service.record(context, other_lesson.id, other_version.id, complete=True)
                    assert (await service.overview(context)).completed_lessons_count == 5
                    assert (await service.overview(context)).completion_percentage == 83.33
                    for moved_lesson, _, _ in pairs[1:]:
                        moved_lesson.unit_id = empty_unit.id
                    await session.flush()
                    assert (await service.unit(context, unit.id))["completion_percentage"] == 100
                    assert (await service.unit(context, empty_unit.id))["completion_percentage"] == 80
                    # Not the unweighted mean (90%) of differently sized units.
                    assert (await service.overview(context)).completion_percentage == 83.33
                    assert len([a for a in await service.achievements(context) if a.earned_at]) == 2
                    from app.services.monitor_progress_service import MonitorProgressService
                    teacher = context.model_copy(update={"user_id": UUID(author.id), "roles": ["MONITOR"], "permissions": [Permissions.PROGRESS_READ_ASSIGNED]})
                    tracking, population = await MonitorProgressService(session).students(teacher, classroom.id, course.id, page=1, page_size=25)
                    assert population == 1 and tracking[0]["completed_lessons_count"] == 5
                    with pytest.raises(ForbiddenError):
                        await MonitorProgressService(session).students(teacher.model_copy(update={"user_id": UUID(reviewer.id)}), classroom.id, course.id, page=1, page_size=25)
                    from app.services.progress_aggregation_service import ProgressAggregationService
                    aggregate_context = teacher.model_copy(update={"permissions": ["progress.read_institution_aggregates"]})
                    aggregate = await ProgressAggregationService(session).summary(aggregate_context)
                    assert aggregate["data_status"] == "suppressed_small_cohort"
                    assert aggregate["enrolled_students_count"] is None
                    with pytest.raises(ForbiddenError):
                        await ProgressAggregationService(session).summary(teacher)
                    events, total = await service.history(context, page=1, page_size=2, event_type="lesson_completed")
                    assert total == 5 and len(events) == 2
                    with pytest.raises(ConflictError):
                        await service.record(context, lesson.id, uuid4(), complete=True)
                    with pytest.raises(NotFoundError):
                        await service.record(context, draft.id, uuid4(), complete=True)
                    foreign = context.model_copy(update={"user_id": UUID(outsider.id), "institution_id": UUID(other_institution.id)})
                    assert (await service.overview(foreign)).active_courses_count == 0
                    with pytest.raises(NotFoundError):
                        await service.lesson(foreign, lesson.id)
                    with pytest.raises(NotFoundError):
                        await service.record(foreign, lesson.id, version.id, complete=True)
                    readonly = context.model_copy(update={"permissions": [Permissions.PROGRESS_READ_OWN]})
                    with pytest.raises(ForbiddenError):
                        await service.record(readonly, lesson.id, version.id, complete=True)
                    assert (await session.execute(select(func.count()).select_from(LearningProgress))).scalar_one() == 5
                    assert (await session.execute(select(func.count()).select_from(StudentAchievement))).scalar_one() == 2
                    publication.status = ContentPublicationStatus.WITHDRAWN
                    await session.flush()
                    assert (await service.overview(context)).applicable_lessons_count == 5
                    assert (await service.overview(context)).completed_lessons_count == 4
                    assert (await service.history(context, page=1, page_size=100))[1] == 10
                    # New published version of the stable lesson preserves recorded completion.
                    replacement = ContentVersion(content_id=lesson.id, content_type="lesson", version="2", version_number=2,
                        author_id=author.id, status="published", is_published=True,
                        snapshot={"title": "Revised published title"}, validation_result={"is_valid": True})
                    session.add(replacement)
                    await session.flush()
                    replacement_review = ContentReview(content_version_id=replacement.id, reviewer_user_id=reviewer.id,
                        institution_id=institution.id, status=ContentReviewStatus.APPROVED)
                    session.add(replacement_review)
                    await session.flush()
                    session.add(ContentPublication(content_version_id=replacement.id, institution_id=institution.id,
                        published_by_user_id=reviewer.id, review_id=replacement_review.id, status=ContentPublicationStatus.PUBLISHED))
                    await session.flush()
                    current = await service.lesson(context, lesson.id)
                    assert current.status == "completed" and str(current.lesson_version_id) == replacement.id
                    assert str(current.completed_lesson_version_id) == version.id
                    old_history, _ = await service.history(context, page=1, page_size=100)
                    assert all(str(e.lesson_version_id) == version.id for e in old_history if str(e.lesson_id) == lesson.id)
                    # Failures in a compound operation leave no partial progress/award.
                    nested = await session.begin_nested()
                    await service.record(context, pairs[5][0].id, pairs[5][1].id, complete=True)
                    await nested.rollback()
                    assert (await session.execute(select(func.count()).select_from(LearningProgress))).scalar_one() == 5
                    # Exercise actual HTTP schemas, permissions and dependency wiring.
                    from app.main import create_app
                    from app.dependencies.auth import get_authorization_context
                    from app.db.session import get_async_session_dependency
                    app = create_app()
                    async def db():
                        yield session
                    async def auth():
                        return context
                    app.dependency_overrides[get_async_session_dependency] = db
                    app.dependency_overrides[get_authorization_context] = auth
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.get("/api/v1/progress/me")
                        assert response.status_code == 200, response.text
                        assert response.headers["cache-control"] == "private, no-store"
                        assert response.json()["competencies"]["data_status"] == "not_available"
                        assert "grade" not in response.json()
                        for path in ("/api/v1/achievements", "/api/v1/badges"):
                            catalog_response = await client.get(path)
                            assert catalog_response.status_code == 200
                            assert len(catalog_response.json()) == 2
                            assert all(item["earned_at"] is None for item in catalog_response.json())
                        unit_response = await client.get(f"/api/v1/progress/units/{unit.id}")
                        assert unit_response.status_code == 200
                        assert unit_response.json()["started_lessons_count"] == 0
                        assert unit_response.json()["last_confirmed_activity_at"] is not None
                        assert (await client.get("/api/v1/progress/me/history?since=2026-10-23T00:00:00")).status_code == 422
                        assert (await client.get("/api/v1/progress/me/history?page_size=101")).status_code == 422
                        response = await client.post(f"/api/v1/progress/lessons/{pairs[5][0].id}/complete", json={"lesson_version_id": pairs[5][1].id, "progress_percentage": 100})
                        assert response.status_code == 422
                        response = await client.get("/api/v1/progress/me/history?page_size=2")
                        assert response.status_code == 200, response.text
                        assert response.json()["total"] == 10
                        assert len(response.json()["items"]) == 2
                        response = await client.post(f"/api/v1/progress/lessons/{pairs[5][0].id}/complete", json={"lesson_version_id": pairs[5][1].id})
                        assert response.status_code == 200, response.text
                        timestamp = response.json()["completed_at"]
                        response = await client.post(f"/api/v1/progress/lessons/{pairs[5][0].id}/complete", json={"lesson_version_id": pairs[5][1].id})
                        assert response.status_code == 200, response.text
                        assert response.json()["completed_at"] == timestamp
                        app.dependency_overrides[get_authorization_context] = lambda: readonly.model_copy(update={"permissions": []})
                        assert (await client.get("/api/v1/progress/me")).status_code == 403
                    app.dependency_overrides.clear()
            finally:
                await transaction.rollback()
    finally:
        await engine.dispose()
