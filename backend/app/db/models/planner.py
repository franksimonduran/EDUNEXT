"""Planner history and private text submissions; no academic-grade columns."""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, ForeignKeyConstraint, String, Text, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class AssignmentVersion(TimestampedUUIDModel):
    __tablename__ = "assignment_versions"
    assignment_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("assignments.id", ondelete="RESTRICT"))
    version_number: Mapped[int] = mapped_column(default=1)
    snapshot: Mapped[dict] = mapped_column(JSONB)
    published_by_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    __table_args__ = (UniqueConstraint("assignment_id", "version_number", name="uq_assignment_version_number"),
                     UniqueConstraint("id", "assignment_id", name="uq_assignment_version_context"),
                     CheckConstraint("version_number >= 1", name="ck_assignment_version_positive"))


class AssignmentSubmission(TimestampedUUIDModel):
    __tablename__ = "assignment_submissions"
    assignment_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    target_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("assignment_targets.id", ondelete="RESTRICT"))
    assignment_version_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("assignment_versions.id", ondelete="RESTRICT"))
    previous_submission_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("assignment_submissions.id", ondelete="RESTRICT"), nullable=True)
    attempt_number: Mapped[int] = mapped_column(default=1)
    revision: Mapped[int] = mapped_column(default=1)
    response_text: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="draft")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    receipt: Mapped[dict] = mapped_column(JSONB, default=dict)
    __table_args__ = (
        ForeignKeyConstraint(["target_id", "assignment_id"], ["assignment_targets.id", "assignment_targets.assignment_id"], name="fk_submission_target_context", ondelete="RESTRICT"),
        ForeignKeyConstraint(["assignment_version_id", "assignment_id"], ["assignment_versions.id", "assignment_versions.assignment_id"], name="fk_submission_version_context", ondelete="RESTRICT"),
        UniqueConstraint("id", "target_id", name="uq_submission_previous_context"),
        ForeignKeyConstraint(["previous_submission_id", "target_id"], ["assignment_submissions.id", "assignment_submissions.target_id"], name="fk_submission_previous_context", ondelete="RESTRICT"),
        UniqueConstraint("target_id", "attempt_number", name="uq_submission_target_attempt"),
        CheckConstraint("attempt_number >= 1 AND revision >= 1", name="ck_submission_revision"),
        CheckConstraint("status IN ('draft','submitted','late_submitted','revision_requested','feedback_available','closed')", name="ck_submission_status"),
        CheckConstraint("(status = 'draft' AND submitted_at IS NULL) OR (status <> 'draft' AND submitted_at IS NOT NULL)", name="ck_submission_received_state"),
    )


class AssignmentFeedback(TimestampedUUIDModel):
    __tablename__ = "assignment_feedback"
    submission_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("assignment_submissions.id", ondelete="RESTRICT"))
    reviewer_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    feedback_text: Mapped[str] = mapped_column(Text)
    requests_revision: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    __table_args__ = (CheckConstraint("status IN ('draft','published')", name="ck_assignment_feedback_status"),
                     Index("ix_planner_feedback_submission", "submission_id", "status"),
                     CheckConstraint("(status = 'draft' AND published_at IS NULL) OR (status = 'published' AND published_at IS NOT NULL)", name="ck_feedback_publication_date"))


class PlannerAudit(TimestampedUUIDModel):
    __tablename__ = "planner_audit"
    __table_args__ = (Index("ix_planner_audit_resource", "institution_id", "resource_id", "created_at"),)
    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"))
    actor_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    resource_id: Mapped[str] = mapped_column(UUID(as_uuid=False))
    operation: Mapped[str] = mapped_column(String(60))
    details: Mapped[dict] = mapped_column(JSONB, default=dict)


class CalendarEvent(TimestampedUUIDModel):
    __tablename__ = "calendar_events"
    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"))
    classroom_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("classrooms.id", ondelete="RESTRICT"), nullable=True)
    course_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("courses.id", ondelete="RESTRICT"), nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    scope: Mapped[str] = mapped_column(String(20))
    all_day: Mapped[bool] = mapped_column(default=False)
    starts_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    ends_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="published")
    revision: Mapped[int] = mapped_column(default=1)
    __table_args__ = (
        Index("ix_planner_calendar_scope", "institution_id", "classroom_id", "status"),
        CheckConstraint("scope IN ('institution','classroom','course')", name="ck_calendar_scope"),
        CheckConstraint("status IN ('published','cancelled') AND revision >= 1", name="ck_calendar_state"),
        CheckConstraint("(scope = 'institution' AND classroom_id IS NULL AND course_id IS NULL) OR (scope = 'classroom' AND classroom_id IS NOT NULL AND course_id IS NULL) OR (scope = 'course' AND classroom_id IS NOT NULL AND course_id IS NOT NULL)", name="ck_calendar_audience"),
        CheckConstraint("(all_day AND starts_on IS NOT NULL AND ends_on IS NOT NULL AND ends_on > starts_on AND starts_at IS NULL AND ends_at IS NULL) OR (NOT all_day AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at AND starts_on IS NULL AND ends_on IS NULL)", name="ck_calendar_dates"),
    )
