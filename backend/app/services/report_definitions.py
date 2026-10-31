"""Versioned, code-owned definitions shared by JSON and CSV. No mutable SQL catalog."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ReportDefinition:
    code: str
    name: str
    permissions: tuple[str, ...]
    export_permission: str
    sources: tuple[str, ...]
    filters: tuple[str, ...] = ()
    population: str = "Authenticated student's own institutional records"
    version: int = 1
    unavailable_reason: str | None = None


DEFINITIONS = {
    d.code: d for d in (
        ReportDefinition("me.overview", "Resumen personal", ("reports.read_own", "progress.read_own", "assignments.read_own"), "reports.export_own",
            ("LearningProgress", "StudentAchievement", "AssignmentTarget", "AssignmentSubmission")),
        ReportDefinition("me.courses", "Finalización por curso", ("reports.read_own", "progress.read_own"), "reports.export_own",
            ("Enrollment", "ContentPublication", "LearningProgress"), ("course_id",)),
        ReportDefinition("me.activities", "Tareas personales", ("reports.read_own", "assignments.read_own"), "reports.export_own",
            ("Assignment", "AssignmentTarget", "AssignmentSubmission"), ("course_id", "academic_period_id")),
        ReportDefinition("me.history", "Historial confirmado", ("reports.read_own", "progress.read_own"), "reports.export_own",
            ("LearningProgress",), ("course_id", "since", "until")),
        ReportDefinition("me.activity_series", "Finalizaciones diarias", ("reports.read_own", "progress.read_own"), "reports.export_own",
            ("LearningProgress",), ("since", "until"), "Own server-recorded lesson completions by institution-local occurrence date"),
        ReportDefinition("monitor.classrooms", "Progreso del aula", ("reports.read_assigned", "progress.read_assigned"), "reports.export_assigned",
            ("TeacherAssignment", "Enrollment", "ContentPublication", "LearningProgress"), ("classroom_id", "course_id", "academic_period_id"),
            "Currently eligible students in an assigned classroom/course; current catalog"),
        ReportDefinition("monitor.assignments", "Entregas por tarea", ("reports.read_assigned", "submissions.read_assigned"), "reports.export_assigned",
            ("TeacherAssignment", "Assignment", "AssignmentTarget", "AssignmentSubmission"), ("classroom_id", "course_id", "academic_period_id"),
            "Snapshot recipients per published task; one latest attempt per recipient"),
        ReportDefinition("institution.enrollments", "Matrícula a fecha de corte", ("reports.read_institution_aggregates",), "reports.export_institution_aggregates",
            ("Enrollment", "Classroom", "AcademicYear", "AcademicPeriod", "Grade"), ("academic_year_id", "academic_period_id", "cutoff"),
            "Distinct students with an effective enrollment interval containing the cutoff"),
        ReportDefinition("institution.overview", "Resumen institucional", ("reports.read_institution_aggregates",), "reports.export_institution_aggregates",
            ("Enrollment", "Course", "Assignment", "AssignmentTarget", "AssignmentSubmission"), (),
            "Current institutional enrollment population; whole-institution planner counts"),
        ReportDefinition("institution.courses", "Cursos y lecciones publicadas", ("reports.read_institution_aggregates",), "reports.export_institution_aggregates",
            ("Course", "Unit", "Lesson", "ContentVersion", "ContentPublication", "ContentReview"), ("grade_id", "course_id"),
            "Active institutional courses; latest authorized published lesson versions, no student data"),
    )
}

for scope, read, export in (
    ("me", "reports.read_own", "reports.export_own"),
    ("monitor", "reports.read_assigned", "reports.export_assigned"),
    ("institution", "reports.read_institution_aggregates", "reports.export_institution_aggregates"),
):
    for kind in ("practices", "assessments", "competencies"):
        code = f"{scope}.{kind}"
        DEFINITIONS[code] = ReportDefinition(code, f"{kind}: fuente confirmada no disponible", (read,), export, (),
            unavailable_reason="Confirmed publication/results/competency sources are not operational; no synthetic counts or levels")


METRICS = {
    "completion_percentage": {
        "name": "Finalización de lecciones", "unit": "percent",
        "formula": "100 * completed_lessons_count / applicable_lessons_count",
        "numerator": "Distinct completed applicable lessons", "denominator": "Applicable published lessons",
        "rounding": "Decimal ROUND_HALF_UP, 2 decimal places; null when denominator is zero",
        "temporal_rule": "Current catalog, not historical catalog reconstruction", "source": "FASE 41 ProgressService",
        "limitation": "Self-declared review; never mastery or AD/A/B/C",
    },
    "submission_percentage": {
        "name": "Entregas confirmadas", "unit": "percent",
        "formula": "100 * received_count / recipients_count",
        "numerator": "Recipients whose latest attempt is submitted, late_submitted, feedback_available, revision_requested or closed",
        "denominator": "Snapshot targets of the selected published task",
        "rounding": "Decimal ROUND_HALF_UP, 2 decimal places; null when denominator is zero",
        "temporal_rule": "Latest submission state at generation; not total attempts",
        "source": "FASE 42 PlannerSummaryService", "limitation": "A new draft correction makes latest attempt pending",
    },
    "unique_students_count": {
        "name": "Estudiantes únicos a fecha de corte", "unit": "students",
        "formula": "COUNT(DISTINCT Enrollment.student_id)", "numerator": "Distinct eligible student IDs", "denominator": None,
        "temporal_rule": "effective_date or enrolled_at <= cutoff < ended_at, with documented missing-end exclusions",
        "source": "Enrollment joined to institutional academic context", "rounding": "Integer",
        "limitation": "Terminal historical rows without ended_at are excluded and reported as partial",
    },
}

for metric_id, name, source, population, states in (
    ("active_courses_count", "Cursos activos", "Course / FASE 41", "Authorized active courses for own summary; whole-institution active courses for institutional summary", "active"),
    ("applicable_lessons_count", "Lecciones aplicables", "FASE 41 published catalog", "Current authorized catalog", "published, valid, independently approved"),
    ("completed_lessons_count", "Lecciones completadas", "LearningProgress / FASE 41", "Distinct current applicable lesson IDs", "completed, progress-engine-v1, same institution"),
    ("earned_achievements_count", "Reconocimientos personales", "StudentAchievement", "Own institutional recognitions", "earned"),
    ("recipients_count", "Destinatarios", "AssignmentTarget", "Published task recipient snapshot, own target only for personal reports", "Published, closed or archived tasks"),
    ("received_count", "Entregas confirmadas vigentes", "AssignmentSubmission", "Latest attempt per selected recipient", "submitted, late_submitted, feedback_available, revision_requested, closed"),
    ("pending_count", "Pendientes", "AssignmentSubmission / FASE 42", "Selected recipients; personal overview only counts open tasks", "No attempt, draft or revision_requested; overlaps received when revision_requested"),
    ("reviewed_count", "Entregas revisadas", "AssignmentSubmission", "Latest attempt per recipient", "feedback_available, revision_requested"),
    ("review_pending_count", "Revisiones pendientes", "AssignmentSubmission", "Latest received attempt per recipient", "submitted, late_submitted"),
    ("late_received_count", "Entregas tardías", "AssignmentSubmission.receipt", "Latest attempt with a receipt", "receipt.late=true"),
    ("overdue_pending_count", "Pendientes fuera de plazo", "AssignmentTarget + AssignmentSubmission / FASE 42", "Own open tasks with latest pending state", "due_at < server time; individual extension applied"),
    ("published_assignments_count", "Tareas publicadas", "Assignment", "Whole institution planner tasks", "published and non-null planner creator"),
    ("recipient_assignments_ever_received_count", "Destinatarios-tarea con alguna recepción", "AssignmentSubmission", "Distinct target_id, all institutional task history", "submitted_at is not null, regardless of latest correction draft"),
    ("published_applicable_lessons_count", "Lecciones publicadas por curso", "FASE 41 catalog query", "Latest authorized published lesson per stable ID", "published, valid, independently approved"),
    ("lesson_completions_occurred_count", "Finalizaciones ocurridas por día", "LearningProgress.completed_at", "Own historical lesson completions in [since, until), grouped in institutional timezone", "completed, progress-engine-v1, same institution; not current-catalog denominator"),
):
    METRICS[metric_id] = {"name": name, "unit": "count", "formula": "Count of the defined population",
        "numerator": population, "denominator": None, "source": source, "states": states,
        "temporal_rule": "Current state at consistent transaction snapshot unless explicitly described as history",
        "rounding": "Integer", "limitation": "Not an official grade, mastery measure or general school participation"}
