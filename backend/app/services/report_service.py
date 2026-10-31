"""Report orchestration over authoritative sources, with explicit privacy boundaries."""

from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError, ConflictError
from app.db.models import AcademicPeriod, AcademicYear, Classroom, Course, Institution, User, UserStatus
from app.db.models.report_access import ReportAccessEvent
from app.repositories.report_repository import ReportRepository
from app.schemas.report import ReportMetadata, ReportMetric, ReportRead
from app.services.report_definitions import DEFINITIONS, METRICS
from app.services.progress_calculator import completion_percentage
from app.services.progress_service import ProgressService
from app.services.planner_summary_service import PlannerSummaryService
from app.services.monitor_progress_service import MonitorProgressService
from app.services.academic_access_service import AcademicAccessService


def definition_for(code, context, *, exporting=False):
    definition = DEFINITIONS.get(code)
    if definition is None:
        raise NotFoundError("Unknown report code")
    required = (*definition.permissions, definition.export_permission) if exporting else definition.permissions
    if not all(p in context.permissions for p in required):
        raise ForbiddenError("Report and source permissions are required")
    return definition


class ReportService:
    def __init__(self, session):
        self.session = session
        self.repo = ReportRepository(session)

    async def identity(self, context):
        row = (await self.session.execute(select(Institution).join(User, User.institution_id == Institution.id).where(
            Institution.id == str(context.institution_id), Institution.status == "active",
            User.id == str(context.user_id), User.status == UserStatus.ACTIVE,
        ))).scalars().first()
        if row is None:
            raise ForbiddenError("An active institutional identity is required")
        return row

    async def catalog(self, context):
        await self.identity(context)
        return [{"code": d.code, "name": d.name, "version": d.version, "scope": d.code.split(".")[0],
                 "permissions": list(d.permissions), "sources": list(d.sources), "filters": list(d.filters),
                 "export_formats": ["csv"] if d.export_permission in context.permissions and not d.unavailable_reason else [],
                 "data_status": "source_not_available" if d.unavailable_reason else "available",
                 "privacy_policy": "whole_distribution_suppression" if d.code.startswith("institution.") else "resource_authorized",
                 "population_definition": d.population}
                for d in DEFINITIONS.values() if all(p in context.permissions for p in d.permissions)]

    async def academic_contexts(self, context):
        definition_for("institution.enrollments", context)
        await self.identity(context)
        rows = (await self.session.execute(select(AcademicYear.id, AcademicYear.name, AcademicYear.start_date,
            AcademicYear.end_date).where(AcademicYear.institution_id == str(context.institution_id)).order_by(
            AcademicYear.year.desc(), AcademicYear.id).limit(100))).mappings().all()
        return {"items": [dict(row) for row in rows], "limit": 100}

    async def generate(self, context, code, filters, *, exporting=False):
        definition = definition_for(code, context, exporting=exporting)
        institution = await self.identity(context)
        provided = filters.model_dump(exclude_none=True, exclude={"page", "page_size"})
        if set(provided) - set(definition.filters):
            raise ValidationError("Unsupported filters for this report; consult the authorized catalog")
        if filters.course_id:
            exists = (await self.session.execute(select(Course.id).where(Course.id == str(filters.course_id),
                Course.institution_id == str(context.institution_id)))).first()
            if exists is None:
                raise NotFoundError("Course not available in this institution")
        if code == "me.activities" and filters.academic_period_id:
            exists = (await self.session.execute(select(AcademicPeriod.id).join(AcademicYear,
                AcademicPeriod.academic_year_id == AcademicYear.id).where(AcademicPeriod.id == str(filters.academic_period_id),
                AcademicYear.institution_id == str(context.institution_id)))).first()
            if exists is None:
                raise NotFoundError("Period not available in this institution")
        if exporting:
            filters = filters.model_copy(update={"page": 1, "page_size": 100})
        metadata = ReportMetadata(report_id=code, definition_version=definition.version,
            institution_id=context.institution_id, generated_at=datetime.now(timezone.utc), timezone=institution.timezone,
            filters=filters.model_dump(mode="json", exclude_none=True), population_definition=definition.population,
            data_status="calculated_from_server_records", sources=list(definition.sources))
        result = ReportRead(metadata=metadata, page=filters.page, page_size=filters.page_size, definitions=METRICS)
        if definition.unavailable_reason:
            result.metadata.data_status = "source_not_available"
            result.metadata.limitations.append(definition.unavailable_reason)
        elif code == "me.overview":
            overview = await ProgressService(self.session).overview(context)
            tasks = await PlannerSummaryService(self.session).personal(context)
            for key in ("active_courses_count", "applicable_lessons_count", "completed_lessons_count", "earned_achievements_count"):
                result.metrics.append(ReportMetric(id=key, value=getattr(overview, key), unit="count"))
            result.metrics.append(ReportMetric(id="completion_percentage", value=overview.completion_percentage, unit="percent",
                numerator=overview.completed_lessons_count, denominator=overview.applicable_lessons_count))
            for key in ("recipients_count", "received_count", "pending_count", "reviewed_count", "overdue_pending_count"):
                result.metrics.append(ReportMetric(id=key, value=tasks[key], unit="recipient_assignments"))
            result.metadata.limitations.append("Practices, games, published assessments and confirmed competencies are unavailable, not zero")
            result.metadata.data_status = "partial"
        elif code == "me.courses":
            progress = await ProgressService(self.session).overview(context, page=None if filters.course_id else filters.page,
                page_size=None if filters.course_id else filters.page_size)
            courses = progress.courses
            if filters.course_id:
                courses = [c for c in courses if c.course_id == filters.course_id]
                if not courses:
                    raise NotFoundError("Course report not available")
                result.total = 1
                if filters.page > 1:
                    courses = []
            else:
                result.total = progress.active_courses_count
            result.rows = [c.model_dump(mode="json", exclude={"lessons"}) for c in courses]
            result.columns = ["course_id", "title", "applicable_lessons_count", "completed_lessons_count", "completion_percentage", "catalog_reference", "last_confirmed_activity_at"]
        elif code == "me.history":
            rows, result.total = await ProgressService(self.session).history(context, page=filters.page, page_size=filters.page_size,
                course_id=filters.course_id, since=filters.since, until=filters.until)
            result.rows = [row.model_dump(mode="json") for row in rows]
            result.columns = ["event_id", "event_type", "course_id", "lesson_id", "lesson_version_id", "occurred_at", "recorded_at"]
        elif code == "me.activity_series":
            if not filters.since or not filters.until:
                raise ValidationError("A bounded since/until interval is required")
            student = await AcademicAccessService(self.session).student(context)
            result.rows, result.total = await self.repo.completion_series(context.institution_id, student.id, institution.timezone, filters)
            result.columns = ["occurred_on", "lesson_completions_occurred_count"]
            result.metadata.limitations.append("Only days with confirmed completions; absent days do not imply no study. Range is [since, until)")
        elif code in {"me.activities", "monitor.assignments"}:
            student_id = None
            if code.startswith("me."):
                student_id = (await AcademicAccessService(self.session).student(context)).id
            else:
                await self.monitor_scope(context, filters, "submissions.read_assigned")
            rows, total = await self.repo.tasks(context, filters, student_id=student_id)
            for row in rows:
                row["submission_percentage"] = completion_percentage(row["received_count"], row["recipients_count"])
            result.rows, result.total = rows, total
            result.columns = ["assignment_id", "title", "recipients_count", "received_count", "pending_count", "reviewed_count", "review_pending_count", "late_received_count", "submission_percentage"]
        elif code == "monitor.classrooms":
            await self.monitor_scope(context, filters, "progress.read_assigned")
            result.rows, result.total = await MonitorProgressService(self.session).students(context,
                filters.classroom_id, filters.course_id, page=filters.page, page_size=filters.page_size,
                period_id=filters.academic_period_id)
            result.columns = ["student_id", "course_id", "applicable_lessons_count", "completed_lessons_count", "completion_percentage"]
            result.metadata.limitations.append("Current enrollment and catalog, not a historical period reconstruction")
        elif code == "institution.courses":
            result.rows, result.total = await self.repo.courses(context.institution_id, filters)
            result.columns = ["course_id", "title", "grade_id", "published_applicable_lessons_count"]
        elif code.startswith("institution."):
            await self.institution_report(context, institution, code, filters, result)
        if result.total == 0 and result.metadata.data_status == "calculated_from_server_records":
            result.metadata.data_status = "no_applicable_records"
        if exporting and definition.unavailable_reason:
            raise ConflictError("This report source is not available for export")
        if exporting and result.total is not None and result.total > 100:
            raise ConflictError("Synchronous exports are limited to 100 rows; narrow the authorized scope")
        self.session.add(ReportAccessEvent(institution_id=str(context.institution_id), actor_user_id=str(context.user_id),
            report_code=code, definition_version=definition.version, operation="export_csv" if exporting else "read",
            data_status=result.metadata.data_status))
        return result

    async def monitor_scope(self, context, filters, permission):
        if not filters.classroom_id or not filters.course_id:
            raise ValidationError("classroom_id and course_id are required")
        await AcademicAccessService(self.session).require_teacher(context, filters.course_id, filters.classroom_id, permission)
        if filters.academic_period_id:
            row = (await self.session.execute(select(AcademicPeriod.id).join(Classroom,
                Classroom.academic_year_id == AcademicPeriod.academic_year_id).where(
                Classroom.id == str(filters.classroom_id), Classroom.institution_id == str(context.institution_id),
                AcademicPeriod.id == str(filters.academic_period_id)))).first()
            if row is None:
                raise NotFoundError("Period not available in this classroom")
            from app.services.planner_access_service import PlannerAccessService
            await PlannerAccessService(self.session).teacher(context, filters.course_id, filters.classroom_id,
                filters.academic_period_id, permission)

    async def institution_report(self, context, institution, code, filters, result):
        now = datetime.now(timezone.utc)
        cutoff = filters.cutoff or now
        year_id = filters.academic_year_id
        zone = ZoneInfo(institution.timezone)
        period = None
        if filters.academic_period_id:
            period = (await self.session.execute(select(AcademicPeriod).join(AcademicYear,
                AcademicPeriod.academic_year_id == AcademicYear.id).where(AcademicPeriod.id == str(filters.academic_period_id),
                AcademicYear.institution_id == str(context.institution_id)))).scalars().first()
            if period is None or (year_id and str(year_id) != period.academic_year_id):
                raise NotFoundError("Academic period not available")
            year_id = period.academic_year_id
            if not filters.cutoff:
                cutoff = min(now, datetime.combine(period.end_date, time.max, zone))
        year = None
        if year_id:
            year = (await self.session.execute(select(AcademicYear).where(AcademicYear.id == str(year_id),
                AcademicYear.institution_id == str(context.institution_id)))).scalars().first()
            if year is None:
                raise NotFoundError("Academic year not available")
            if not filters.cutoff and not period:
                cutoff = min(now, datetime.combine(year.end_date, time.max, zone))
        if cutoff > now:
            raise ValidationError("Cutoff cannot be in the future")
        local = cutoff.astimezone(zone).date()
        if (year and not year.start_date <= local <= year.end_date) or (period and not period.start_date <= local <= period.end_date):
            raise ValidationError("Cutoff is outside the requested academic context")
        result.metadata.filters.update({"cutoff": cutoff.isoformat(), "academic_year_id": str(year_id) if year_id else None})
        groups, incomplete = await self.repo.enrollments(context.institution_id, cutoff, local, year_id)
        population = sum(row["unique_students_count"] for row in groups)
        minimum = settings.REPORT_MIN_GROUP_SIZE
        suppressed = 0 < population < minimum or any(0 < row["unique_students_count"] < minimum for row in groups)
        if incomplete:
            result.metadata.limitations.append("Some historical intervals have missing ended_at; these cannot be reconstructed and were excluded")
        counts = await self.repo.institution_counts(context.institution_id) if code == "institution.overview" else {}
        if code == "institution.overview" and (population == 0 or any(0 < count < minimum for count in counts.values())):
            suppressed = True
        if suppressed:
            result.metadata.data_status = "suppressed_small_cohort"
            result.metadata.limitations.append(f"Whole distribution and totals withheld; minimum group size {minimum}; no complementary totals")
            result.metrics = [ReportMetric(id="unique_students_count", value=None, unit="students", data_status="suppressed_small_cohort")]
            result.total = None
            return
        result.metrics = [ReportMetric(id="unique_students_count", value=population, unit="students")]
        result.metrics += [ReportMetric(id=key, value=value, unit="count") for key, value in counts.items()]
        result.rows = groups[(filters.page-1)*filters.page_size:filters.page*filters.page_size]
        result.total = len(groups)
        result.columns = ["grade", "unique_students_count"]
        result.metadata.data_status = "partial" if incomplete else "calculated_from_server_records" if population else "no_applicable_records"
        if code == "institution.overview":
            result.metadata.limitations.append("Planner counts are whole-institution current/history facts, not a historical cutoff series")
