"""Lesson completion facts, personal recognitions and derived progress."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.db.models import LearningProgress, StudentProfile
from app.db.models.student_achievement import StudentAchievement
from app.repositories.progress_repository import ORIGIN, ProgressRepository
from app.schemas.progress import (
    AchievementRead, CourseProgressRead, LearningHistoryRead, LessonProgressRead,
    ProgressOverview, SourceAvailability,
)
from app.schemas.permission import Permissions
from app.services.academic_access_service import AcademicAccessService
from app.services.progress_calculator import ACHIEVEMENTS, catalog_reference, completion_percentage


RECORD_PERMISSION = Permissions.PROGRESS_RECORD_OWN_ACTIVITY


class ProgressService:
    def __init__(self, session):
        self.session = session
        self.repository = ProgressRepository(session)
        self.access = AcademicAccessService(session)

    async def student(self, context):
        if Permissions.PROGRESS_READ_OWN not in context.permissions:
            raise ForbiddenError("Own progress permission required")
        return await self.access.student(context)

    async def overview(self, context, *, page=None, page_size=None):
        student = await self.student(context)
        courses, total_courses = await self.repository.courses(context, student.id, page=page, page_size=page_size)
        catalog = await self.repository.catalog(context.institution_id, [c.id for c in courses])
        facts = {str(f.lesson_id): f for f in await self.repository.facts(context.institution_id, student.id)}
        awards = await self.repository.awards(context.institution_id, student.id)
        result = []
        for course in courses:
            lessons = []
            for entry in catalog:
                if str(entry.course_id) != str(course.id):
                    continue
                fact = facts.get(str(entry.lesson_id))
                lessons.append(LessonProgressRead(
                    lesson_id=entry.lesson_id, lesson_version_id=entry.version_id, unit_id=entry.unit_id,
                    title=entry.snapshot.get("title", "Lección"),
                    status=fact.status if fact else "not_started",
                    completed_at=fact.completed_at if fact else None,
                    started_at=fact.started_at if fact else None,
                    completed_lesson_version_id=fact.metadata_.get("lesson_version_id") if fact and fact.status == "completed" else None,
                    completion_source=fact.metadata_.get("completion_source") if fact else None,
                ))
            completed = sum(x.status == "completed" for x in lessons)
            result.append(CourseProgressRead(
                course_id=course.id, title=course.name,
                applicable_lessons_count=len(lessons), started_lessons_count=sum(x.status == "started" for x in lessons),
                completed_lessons_count=completed,
                completion_percentage=completion_percentage(completed, len(lessons)),
                state="available" if lessons else "no_applicable_content",
                catalog_reference=catalog_reference((x.lesson_id, x.lesson_version_id) for x in lessons), lessons=lessons,
                last_confirmed_activity_at=max((date for x in lessons for date in (x.started_at, x.completed_at) if date), default=None),
            ))
        total = sum(x.applicable_lessons_count for x in result)
        completed = sum(x.completed_lessons_count for x in result)
        return ProgressOverview(
            can_record_own_activity=RECORD_PERMISSION in context.permissions,
            active_courses_count=total_courses, applicable_lessons_count=total, completed_lessons_count=completed,
            earned_achievements_count=sum(a.status == "earned" for a in awards),
            last_confirmed_activity_at=max((date for f in facts.values() for date in (f.started_at, f.completed_at) if date), default=None),
            completion_percentage=completion_percentage(completed, total), courses=result,
            practices=SourceAvailability(reason="Practice publication, result integrity and privacy are not yet verified"),
            games=SourceAvailability(reason="Game results still rely on client-provided scores"),
            assessments=SourceAvailability(reason="Assessment result publication workflow is not implemented"),
            competencies=SourceAvailability(reason="Confirmed competency achievements and academic records are not implemented"),
        )

    async def course(self, context, course_id):
        overview = await self.overview(context)
        result = next((c for c in overview.courses if str(c.course_id) == str(course_id)), None)
        if result is None:
            raise NotFoundError("Course progress not available")
        return result

    async def unit(self, context, unit_id):
        overview = await self.overview(context)
        lessons = [lesson for course in overview.courses for lesson in course.lessons if str(lesson.unit_id) == str(unit_id)]
        # Authorize even an empty unit via its course, without exposing other institutions.
        from app.db.models import Unit
        unit = (await self.session.execute(select(Unit).where(
            Unit.id == str(unit_id), Unit.course_id.in_([str(c.course_id) for c in overview.courses]),
            Unit.status != "archived",
        ))).scalars().first()
        if unit is None:
            raise NotFoundError("Unit progress not available")
        completed = sum(x.status == "completed" for x in lessons)
        return {
            "unit_id": str(unit.id), "course_id": str(unit.course_id),
            "applicable_lessons_count": len(lessons), "completed_lessons_count": completed,
            "started_lessons_count": sum(x.status == "started" for x in lessons),
            "last_confirmed_activity_at": max((date for x in lessons for date in (x.started_at, x.completed_at) if date), default=None),
            "completion_percentage": completion_percentage(completed, len(lessons)),
            "state": "available" if lessons else "no_applicable_content",
            "catalog_reference": catalog_reference((x.lesson_id, x.lesson_version_id) for x in lessons),
            "lessons": lessons, "source": "calculated_from_server_records",
        }

    async def lesson(self, context, lesson_id):
        overview = await self.overview(context)
        for course in overview.courses:
            for lesson in course.lessons:
                if str(lesson.lesson_id) == str(lesson_id):
                    return lesson
        raise NotFoundError("Published lesson progress not available")

    async def record(self, context, lesson_id, version_id, *, complete):
        if RECORD_PERMISSION not in context.permissions:
            raise ForbiddenError("Explicit activity recording permission required")
        student = await self.student(context)
        # All own activity writes serialize on the same existing profile row. This
        # also serializes threshold recognition grants across different lessons.
        await self.session.execute(select(StudentProfile.id).where(StudentProfile.id == str(student.id)).with_for_update())
        courses, _ = await self.repository.courses(context, student.id)
        catalog = await self.repository.catalog(context.institution_id, [c.id for c in courses])
        entry = next((x for x in catalog if str(x.lesson_id) == str(lesson_id)), None)
        if entry is None:
            raise NotFoundError("Published lesson not available for this student")
        if str(entry.version_id) != str(version_id):
            raise ConflictError("Published lesson version changed; reload before recording")
        enrollment = await self.access.enrollment(context, entry.course_id)
        fact = (await self.session.execute(select(LearningProgress).where(
            LearningProgress.student_id == str(student.id), LearningProgress.lesson_id == str(lesson_id),
        ).with_for_update())).scalars().first()
        now = datetime.now(timezone.utc)
        if fact is not None and (
            fact.metadata_.get("origin") != ORIGIN
            or fact.metadata_.get("institution_id") != str(context.institution_id)
        ):
            raise ConflictError("Existing legacy progress requires explicit reconciliation")
        if fact is None:
            fact = LearningProgress(
                student_id=str(student.id), lesson_id=str(lesson_id), status="started",
                started_at=now, last_accessed_at=now, progress_percentage=0,
                metadata_={"origin": ORIGIN, "institution_id": str(context.institution_id),
                           "enrollment_id": str(enrollment.id), "course_id": str(entry.course_id),
                           "lesson_version_id": str(version_id), "started_version_id": str(version_id), "completion_source": None},
            )
            self.session.add(fact)
            await self.session.flush()
        if complete and fact.status != "completed":
            fact.status = "completed"
            fact.completed_at = now
            fact.progress_percentage = 100
            fact.metadata_ = {**fact.metadata_, "lesson_version_id": str(version_id),
                              "completed_enrollment_id": str(enrollment.id),
                              "completion_source": "student_self_declared_server_recorded"}
            facts = await self.repository.facts(context.institution_id, student.id)
            applicable_ids = {str(x.lesson_id) for x in catalog}
            count = len({f.lesson_id for f in facts if f.status == "completed" and str(f.lesson_id) in applicable_ids})
            awards = await self.repository.awards(context.institution_id, student.id)
            existing = {a.code for a in awards}
            for rule in ACHIEVEMENTS:
                if count >= rule["threshold"] and rule["code"] not in existing:
                    self.session.add(StudentAchievement(
                        institution_id=str(context.institution_id), student_id=str(student.id),
                        source_progress_id=str(fact.id), code=rule["code"], rule_version=1,
                    ))
        await self.session.flush()
        # Serialize before commit; the router confirms only after successful commit.
        return LessonProgressRead(
            lesson_id=entry.lesson_id, lesson_version_id=entry.version_id, unit_id=entry.unit_id,
            title=entry.snapshot.get("title", "Lección"), status=fact.status, completed_at=fact.completed_at,
            started_at=fact.started_at,
            completed_lesson_version_id=fact.metadata_.get("lesson_version_id") if fact.status == "completed" else None,
            completion_source=fact.metadata_.get("completion_source"),
        )

    async def achievements(self, context):
        student = await self.student(context)
        awards = {a.code: a for a in await self.repository.awards(context.institution_id, student.id)}
        return [AchievementRead(
            code=r["code"], name=r["name"], description=r["description"],
            status=awards[r["code"]].status if r["code"] in awards else "available",
            earned_at=awards[r["code"]].earned_at if r["code"] in awards else None,
        ) for r in ACHIEVEMENTS]

    async def history(self, context, *, page, page_size, course_id=None, event_type=None, since=None, until=None):
        student = await self.student(context)
        rows, total = await self.repository.history(
            context.institution_id, student.id, page=page, page_size=page_size,
            course_id=course_id, event_type=event_type, since=since, until=until,
        )
        return [LearningHistoryRead(**r) for r in rows], total
