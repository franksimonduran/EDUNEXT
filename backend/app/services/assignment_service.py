"""Real task lifecycle, snapshot recipients and private text-only submissions."""

from uuid import UUID

from sqlalchemy import select

from app.core import planner_rules as rules
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ServiceUnavailableError, ValidationError
from app.db.models import Assignment, AssignmentTarget, Enrollment, EnrollmentStatus, Lesson, Unit
from app.db.models.assignment import AssignmentStatus, AssignmentType
from app.db.models.planner import AssignmentFeedback, AssignmentSubmission, AssignmentVersion, PlannerAudit
from app.repositories.planner_repository import PlannerRepository
from app.repositories.progress_repository import ProgressRepository
from app.services.academic_common import find_idempotent_result, record_idempotency
from app.services.planner_access_service import PlannerAccessService


def task_read(task):
    return {"id": task.id, "course_id": task.course_id, "classroom_id": task.planner_classroom_id,
            "academic_period_id": task.academic_period_id, "title": task.title,
            "instructions": task.instructions, "status": "closed" if task.status == AssignmentStatus.COMPLETED else task.status.value,
            "available_from": task.available_from, "due_at": task.due_at, "revision": task.planner_revision,
            "allow_late_submission": task.allow_late_submission, "allow_resubmission": task.allow_resubmission,
            "source": "server_recorded", "purpose": "formative_assignment"}


def submission_read(submission):
    return {"id": submission.id, "target_id": submission.target_id, "assignment_version_id": submission.assignment_version_id,
            "previous_submission_id": submission.previous_submission_id, "attempt_number": submission.attempt_number,
            "revision": submission.revision, "status": submission.status, "response_text": submission.response_text,
            "submitted_at": submission.submitted_at, "receipt": submission.receipt}


class AssignmentService:
    def __init__(self, session):
        self.session = session
        self.repo = PlannerRepository(session)
        self.access = PlannerAccessService(session)

    def audit(self, context, resource_id, operation, **details):
        self.session.add(PlannerAudit(institution_id=str(context.institution_id), actor_user_id=str(context.user_id),
                                      resource_id=str(resource_id), operation=operation, details=details))

    async def teacher_task(self, context, task_id, code, *, lock=False):
        task = await self.repo.task(context.institution_id, task_id, lock=lock)
        await self.access.teacher(context, task.course_id, task.planner_classroom_id, task.academic_period_id, code)
        return task

    async def create(self, context, data):
        await self.access.teacher(context, data.course_id, data.classroom_id, data.academic_period_id, rules.CREATE)
        course, classroom, period, year, institution = await self.access.academic_context(context, data.course_id, data.classroom_id, data.academic_period_id, data.available_from, data.due_at)
        if data.unit_id:
            unit = await self.session.get(Unit, str(data.unit_id))
            if unit is None or unit.course_id != str(data.course_id):
                raise ValidationError("Unit does not belong to course")
        if data.lesson_id:
            catalog = await ProgressRepository(self.session).catalog(context.institution_id, [data.course_id])
            entry = next((x for x in catalog if str(x.lesson_id) == str(data.lesson_id)), None)
            if entry is None or (data.unit_id and str(entry.unit_id) != str(data.unit_id)):
                raise ValidationError("An authorized published lesson in the selected course/unit is required")
        if data.student_ids is not None:
            enrolled = await self.access.enrolled(context, classroom.id, year.id, student_ids=data.student_ids)
            if {str(x) for x in data.student_ids} != {x.student_id for x in enrolled}:
                raise ValidationError("Every individual recipient requires an active enrollment in this classroom")
        task = Assignment(
            institution_id=str(context.institution_id), course_id=course.id, planner_classroom_id=classroom.id,
            academic_year_id=year.id, academic_period_id=period.id, created_by_user_id=str(context.user_id),
            unit_id=str(data.unit_id) if data.unit_id else None, lesson_id=str(data.lesson_id) if data.lesson_id else None,
            title=data.title, instructions=data.instructions, assignment_type=AssignmentType(data.assignment_type),
            available_from=data.available_from, due_at=data.due_at, status=AssignmentStatus.DRAFT,
            allow_late_submission=data.allow_late_submission, allow_resubmission=data.allow_resubmission,
            max_attempts=data.max_attempts, planner_revision=1,
            metadata_={"origin": "planner42", "recipient_policy": "snapshot_at_publication", "student_ids": [str(x) for x in data.student_ids] if data.student_ids else None},
        )
        self.session.add(task)
        await self.session.flush()
        self.audit(context, task.id, "assignment.created")
        return task_read(task)

    async def update(self, context, task_id, data):
        task = await self.teacher_task(context, task_id, rules.UPDATE, lock=True)
        if task.created_by_user_id != str(context.user_id):
            raise ForbiddenError("Only the author can edit this draft")
        rules.revision(task.planner_revision, data.expected_revision)
        if task.status != AssignmentStatus.DRAFT:
            raise ConflictError("Published instructions are immutable; create a new task")
        values = data.model_dump(exclude_unset=True, exclude={"expected_revision"})
        if any(value is None for value in values.values()):
            raise ValidationError("Editable fields cannot be null")
        await self.access.academic_context(context, task.course_id, task.planner_classroom_id, task.academic_period_id,
            values.get("available_from", task.available_from), values.get("due_at", task.due_at))
        for key, value in values.items():
            setattr(task, key, value)
        task.planner_revision += 1
        self.audit(context, task.id, "assignment.updated", revision=task.planner_revision)
        await self.session.flush()
        return task_read(task)

    async def publish(self, context, task_id, data, key):
        task = await self.teacher_task(context, task_id, rules.PUBLISH, lock=True)
        payload = {"assignment_id": str(task.id), **data.model_dump(mode="json")}
        replay = await find_idempotent_result(self.session, context, operation="planner.publish", key=key, payload=payload)
        if replay:
            return {"assignment": task_read(task), "assignment_version_id": str(replay)}
        rules.revision(task.planner_revision, data.expected_revision)
        if task.status != AssignmentStatus.DRAFT:
            raise ConflictError("Only a draft can be published")
        await self.access.academic_context(context, task.course_id, task.planner_classroom_id, task.academic_period_id, task.available_from, task.due_at)
        if task.resource_ids or task.attachment_ids:
            raise ServiceUnavailableError("Resource integrity and private attachment authorization are not verified")
        lesson_version_id = None
        if task.lesson_id:
            catalog = await ProgressRepository(self.session).catalog(context.institution_id, [task.course_id])
            entry = next((x for x in catalog if str(x.lesson_id) == task.lesson_id), None)
            if entry is None or (task.unit_id and str(entry.unit_id) != task.unit_id):
                raise ConflictError("Linked lesson is no longer published in the selected course/unit")
            lesson_version_id = str(entry.version_id)
        enrolled = await self.access.enrolled(context, task.planner_classroom_id, task.academic_year_id, student_ids=task.metadata_.get("student_ids"))
        expected = task.metadata_.get("student_ids")
        if not enrolled or (expected is not None and set(expected) != {x.student_id for x in enrolled}):
            raise ConflictError("Recipients changed or no active recipients are available")
        version = AssignmentVersion(assignment_id=task.id, version_number=1, published_by_user_id=str(context.user_id), snapshot={
            "title": task.title, "instructions": task.instructions, "available_from": task.available_from.isoformat(),
            "due_at": task.due_at.isoformat(), "allow_late_submission": task.allow_late_submission,
            "allow_resubmission": task.allow_resubmission, "max_attempts": task.max_attempts,
            "lesson_id": task.lesson_id, "lesson_version_id": lesson_version_id, "unit_id": task.unit_id,
        })
        self.session.add(version)
        for enrollment in enrolled:
            self.session.add(AssignmentTarget(assignment_id=task.id, student_id=enrollment.student_id,
                enrollment_id=enrollment.id, status="assigned"))
        task.status = AssignmentStatus.PUBLISHED
        task.planner_revision += 1
        task.assigned_at = rules.now_utc()
        await self.session.flush()
        await record_idempotency(self.session, context, operation="planner.publish", key=key, payload=payload,
            resource_type="assignment_version", resource_id=UUID(version.id))
        self.audit(context, task.id, "assignment.published", version_id=version.id, recipients=len(enrolled))
        return {"assignment": task_read(task), "assignment_version_id": version.id}

    async def close(self, context, task_id, data):
        task = await self.teacher_task(context, task_id, rules.UPDATE, lock=True)
        rules.revision(task.planner_revision, data.expected_revision)
        if task.status != AssignmentStatus.PUBLISHED:
            raise ConflictError("Only a published assignment can be closed")
        task.status = AssignmentStatus.COMPLETED
        task.planner_revision += 1
        self.audit(context, task.id, "assignment.closed")
        return task_read(task)

    async def own_task(self, context, task_id, code=rules.READ, *, lock=False):
        student = await self.access.student(context, code)
        task = await self.repo.task(context.institution_id, task_id, lock=lock)
        if task.status == AssignmentStatus.DRAFT:
            raise NotFoundError("Assignment not published")
        target = await self.repo.target(task.id, student.id, lock=lock)
        return task, target, student

    async def write_window(self, context, task, target):
        if task.status != AssignmentStatus.PUBLISHED:
            raise ConflictError("Assignment is closed")
        active = await self.access.enrolled(context, task.planner_classroom_id, task.academic_year_id, student_ids=[target.student_id])
        if not any(x.id == target.enrollment_id for x in active):
            raise ForbiddenError("Original target enrollment is no longer active; previous work is retained")
        return rules.submission_late(rules.now_utc(), task.available_from, target.custom_due_at or task.due_at, task.allow_late_submission)

    async def begin(self, context, task_id, key, *, previous_id=None):
        task, target, student = await self.own_task(context, task_id, rules.SUBMIT, lock=True)
        await self.write_window(context, task, target)
        payload = {"assignment_id": task.id, "previous_id": str(previous_id) if previous_id else None}
        replay = await find_idempotent_result(self.session, context, operation="planner.begin", key=key, payload=payload)
        if replay:
            return submission_read(await self.session.get(AssignmentSubmission, str(replay)))
        latest = (await self.session.execute(select(AssignmentSubmission).where(AssignmentSubmission.target_id == target.id).order_by(AssignmentSubmission.attempt_number.desc()).limit(1))).scalars().first()
        if previous_id is None and latest:
            if latest.status != "draft":
                raise ConflictError("Use the authorized resubmission operation")
            submission = latest
        else:
            if previous_id and (latest is None or str(previous_id) != latest.id or latest.status != "revision_requested" or not task.allow_resubmission or latest.attempt_number >= task.max_attempts):
                raise ConflictError("Resubmission is not authorized")
            version = await self.repo.version(task.id)
            submission = AssignmentSubmission(assignment_id=task.id, target_id=target.id, assignment_version_id=version.id,
                previous_submission_id=latest.id if previous_id else None, attempt_number=latest.attempt_number+1 if latest else 1,
                response_text=latest.response_text if latest else "", revision=1, status="draft")
            self.session.add(submission)
            await self.session.flush()
        await record_idempotency(self.session, context, operation="planner.begin", key=key, payload=payload, resource_type="assignment_submission", resource_id=UUID(submission.id))
        self.audit(context, submission.id, "submission.draft_created")
        return submission_read(submission)

    async def submission_context(self, context, submission_id, code, *, teacher=False, lock=False):
        # Lookup is scoped through task institution before authorization or returning content.
        row = (await self.session.execute(select(AssignmentSubmission.id, Assignment.id).join(AssignmentTarget, AssignmentSubmission.target_id == AssignmentTarget.id).join(Assignment, AssignmentTarget.assignment_id == Assignment.id).where(
            AssignmentSubmission.id == str(submission_id), Assignment.institution_id == str(context.institution_id),
        ))).first()
        if row is None:
            raise NotFoundError("Submission not found")
        if teacher:
            task = await self.teacher_task(context, row[1], code, lock=lock)
            target = None
        else:
            task, target, _ = await self.own_task(context, row[1], code, lock=lock)
        submission = (await self.session.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == str(submission_id)).execution_options(populate_existing=True))).scalars().one()
        if not teacher and submission.target_id != target.id:
            raise NotFoundError("Submission not found")
        return task, target, submission

    async def get_submission(self, context, submission_id, *, teacher=False):
        task, _, submission = await self.submission_context(context, submission_id, rules.READ_SUBMISSIONS if teacher else rules.READ, teacher=teacher)
        feedback = (await self.session.execute(select(AssignmentFeedback).where(
            AssignmentFeedback.submission_id == submission.id,
            True if teacher else AssignmentFeedback.status == "published",
        ).order_by(AssignmentFeedback.created_at, AssignmentFeedback.id))).scalars().all()
        return {**submission_read(submission), "feedback": [{"id": f.id, "feedback_text": f.feedback_text, "status": f.status, "requests_revision": f.requests_revision, "published_at": f.published_at} for f in feedback]}

    async def save(self, context, submission_id, data):
        task, target, submission = await self.submission_context(context, submission_id, rules.SUBMIT, lock=True)
        await self.write_window(context, task, target)
        rules.revision(submission.revision, data.expected_revision)
        if submission.status != "draft":
            raise ConflictError("Submitted work is immutable")
        submission.response_text = data.response_text
        submission.revision += 1
        await self.session.flush()
        return submission_read(submission)

    async def submit(self, context, submission_id, data, key):
        task, target, submission = await self.submission_context(context, submission_id, rules.SUBMIT, lock=True)
        payload = {"submission_id": submission.id, **data.model_dump(mode="json")}
        replay = await find_idempotent_result(self.session, context, operation="planner.submit", key=key, payload=payload)
        if replay:
            return submission_read(submission)
        if submission.submitted_at is not None:
            raise ConflictError("Submission already received")
        late = await self.write_window(context, task, target)
        rules.revision(submission.revision, data.expected_revision)
        if submission.status != "draft" or not submission.response_text.strip():
            raise ConflictError("A nonempty draft is required")
        submission.status = "late_submitted" if late else "submitted"
        submission.submitted_at = rules.now_utc()
        submission.revision += 1
        submission.receipt = {"confirmation_reference": submission.id, "received_at": submission.submitted_at.isoformat(),
                              "late": late,
                              "assignment_version_id": submission.assignment_version_id,
                              "deadline_at_submission": (target.custom_due_at or task.due_at).isoformat()}
        await self.session.flush()
        await record_idempotency(self.session, context, operation="planner.submit", key=key, payload=payload, resource_type="assignment_submission", resource_id=UUID(submission.id))
        self.audit(context, submission.id, "submission.received", late=late)
        return submission_read(submission)

    async def feedback(self, context, submission_id, data):
        task, _, submission = await self.submission_context(context, submission_id, rules.REVIEW, teacher=True, lock=True)
        rules.revision(submission.revision, data.expected_revision)
        if not submission.submitted_at:
            raise ConflictError("Only received work can be reviewed")
        await self.require_latest_submission(submission)
        if data.requests_revision and not task.allow_resubmission:
            raise ConflictError("Task does not allow resubmission")
        feedback = AssignmentFeedback(submission_id=submission.id, reviewer_user_id=str(context.user_id), feedback_text=data.feedback_text, requests_revision=data.requests_revision)
        self.session.add(feedback)
        submission.revision += 1
        await self.session.flush()
        self.audit(context, submission.id, "feedback.drafted", feedback_id=feedback.id)
        return {"id": feedback.id, "status": feedback.status, "submission_revision": submission.revision}

    async def require_latest_submission(self, submission):
        newer = (await self.session.execute(select(AssignmentSubmission.id).where(
            AssignmentSubmission.target_id == submission.target_id,
            AssignmentSubmission.attempt_number > submission.attempt_number,
        ).limit(1))).first()
        if newer:
            raise ConflictError("A newer submission exists; review the latest attempt")

    async def publish_feedback(self, context, feedback_id, data):
        row = (await self.session.execute(select(AssignmentFeedback).join(AssignmentSubmission, AssignmentFeedback.submission_id == AssignmentSubmission.id).join(AssignmentTarget, AssignmentSubmission.target_id == AssignmentTarget.id).join(Assignment, AssignmentTarget.assignment_id == Assignment.id).where(
            AssignmentFeedback.id == str(feedback_id), Assignment.institution_id == str(context.institution_id),
        ))).scalars().first()
        if row is None:
            raise NotFoundError("Feedback not found")
        task, _, submission = await self.submission_context(context, row.submission_id, rules.REVIEW, teacher=True, lock=True)
        await self.session.refresh(row)
        if row.status == "published":
            return {"id": row.id, "status": row.status, "submission_revision": submission.revision}
        rules.revision(submission.revision, data.expected_revision)
        if row.reviewer_user_id != str(context.user_id):
            raise ForbiddenError("Only the feedback author can publish it")
        await self.require_latest_submission(submission)
        row.status = "published"
        row.published_at = rules.now_utc()
        submission.status = "revision_requested" if row.requests_revision else "feedback_available"
        submission.revision += 1
        self.audit(context, submission.id, "feedback.published", feedback_id=row.id)
        return {"id": row.id, "status": row.status, "submission_revision": submission.revision}

    async def extend(self, context, target_id, data):
        row = (await self.session.execute(select(AssignmentTarget).join(Assignment, AssignmentTarget.assignment_id == Assignment.id).where(AssignmentTarget.id == str(target_id), Assignment.institution_id == str(context.institution_id)))).scalars().first()
        if row is None:
            raise NotFoundError("Target not found")
        task = await self.teacher_task(context, row.assignment_id, rules.UPDATE, lock=True)
        await self.session.refresh(row)
        rules.revision(row.planner_revision, data.expected_revision)
        old = row.custom_due_at or task.due_at
        if task.status != AssignmentStatus.PUBLISHED or data.due_at <= old:
            raise ConflictError("An extension requires a published task and a later deadline")
        await self.access.academic_context(context, task.course_id, task.planner_classroom_id, task.academic_period_id, task.available_from, data.due_at)
        row.custom_due_at = data.due_at
        row.planner_revision += 1
        self.audit(context, row.id, "target.extended", old=old.isoformat(), new=data.due_at.isoformat(), reason=data.reason)
        return {"target_id": row.id, "due_at": row.custom_due_at, "revision": row.planner_revision}

    async def archive(self, context, task_id, data):
        task = await self.teacher_task(context, task_id, rules.UPDATE, lock=True)
        rules.revision(task.planner_revision, data.expected_revision)
        if task.status not in {AssignmentStatus.DRAFT, AssignmentStatus.COMPLETED}:
            raise ConflictError("Close the published task before archiving")
        task.status = AssignmentStatus.ARCHIVED
        task.planner_revision += 1
        self.audit(context, task.id, "assignment.archived")
        return task_read(task)
