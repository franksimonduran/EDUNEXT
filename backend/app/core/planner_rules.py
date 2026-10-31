"""Explicit planner policies; never write academic grades."""

from datetime import datetime, timezone

from app.core.exceptions import ConflictError, ForbiddenError

CREATE = "assignments.create_assigned"
UPDATE = "assignments.update_assigned"
PUBLISH = "assignments.publish_assigned"
READ = "assignments.read_own"
SUBMIT = "submissions.create_own"
REVIEW = "submissions.review_assigned"
READ_SUBMISSIONS = "submissions.read_assigned"
CALENDAR_READ = "calendar.read_own"
CALENDAR_MANAGE = "calendar.manage_assigned"
CALENDAR_INSTITUTION = "calendar.manage_institution"
RECEIVED_SUBMISSION_STATES = ("submitted", "late_submitted", "feedback_available", "revision_requested", "closed")
REVIEWED_SUBMISSION_STATES = ("feedback_available", "revision_requested")
PENDING_SUBMISSION_STATES = ("draft", "revision_requested")


def now_utc():
    return datetime.now(timezone.utc)


def permission(context, code):
    if code not in context.permissions:
        raise ForbiddenError("Insufficient planner permission")


def revision(current, expected):
    if current != expected:
        raise ConflictError("Record changed; reload before saving")


def submission_late(now, available, due, allow_late):
    if now < available:
        raise ConflictError("Assignment is not available yet")
    late = now > due  # Exactly at the deadline is admitted.
    if late and not allow_late:
        raise ConflictError("Submission deadline passed")
    return late
