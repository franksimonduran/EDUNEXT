"""Assignment and AssignmentTarget models."""

import enum
from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Integer, UniqueConstraint, func, Enum, JSON, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class AssignmentStatus(str, enum.Enum):
    """Assignment status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class AssignmentType(str, enum.Enum):
    """Assignment type."""
    HOMEWORK = "homework"
    CLASSWORK = "classwork"
    PROJECT = "project"
    READING = "reading"
    RESEARCH = "research"
    PRACTICE = "practice"
    OTHER = "other"


class Assignment(TimestampedUUIDModel):
    """Assignment model."""
    
    __tablename__ = "assignments"
    __table_args__ = (Index("ix_planner_assignment_scope_due", "institution_id", "planner_classroom_id", "due_at"),)
    
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    unit_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("units.id", ondelete="SET NULL"),
        nullable=True,
    )
    lesson_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    assignment_type: Mapped[AssignmentType] = mapped_column(
        Enum(AssignmentType, values_callable=lambda x: [e.value for e in x]),
        default=AssignmentType.HOMEWORK,
        nullable=False,
    )
    status: Mapped[AssignmentStatus] = mapped_column(
        Enum(AssignmentStatus, values_callable=lambda x: [e.value for e in x]),
        default=AssignmentStatus.DRAFT,
        nullable=False,
    )
    
    # Dates
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    available_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    available_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Settings
    max_score: Mapped[Optional[int]] = mapped_column(nullable=True)
    is_required: Mapped[bool] = mapped_column(default=True, nullable=False)
    allow_late_submission: Mapped[bool] = mapped_column(default=True, nullable=False)
    late_penalty_percent: Mapped[int] = mapped_column(default=0, nullable=False)
    allow_resubmission: Mapped[bool] = mapped_column(default=False, nullable=False)
    max_attempts: Mapped[int] = mapped_column(default=1, nullable=False)
    
    # Resources
    resource_ids: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    attachment_ids: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    
    # Metadata
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    estimated_time_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    difficulty: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    institution_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=True)
    planner_classroom_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("classrooms.id", ondelete="RESTRICT"), nullable=True)
    academic_year_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=True)
    academic_period_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("academic_periods.id", ondelete="RESTRICT"), nullable=True)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    planner_revision: Mapped[int] = mapped_column(default=1, server_default="1", nullable=False)
    
    # Relationships
    course = relationship("Course")
    unit = relationship("Unit")
    lesson = relationship("Lesson")
    targets = relationship("AssignmentTarget", back_populates="assignment", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Assignment(id={self.id}, title={self.title}, status={self.status})>"


class AssignmentTarget(TimestampedUUIDModel):
    """Assignment assignment to specific students or groups."""
    
    __tablename__ = "assignment_targets"
    
    assignment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=True,
    )
    classroom_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=True,
    )
    
    # Override settings for this target
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    available_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    available_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_required: Mapped[Optional[bool]] = mapped_column(nullable=True)
    custom_max_score: Mapped[Optional[int]] = mapped_column(nullable=True)
    custom_due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    enrollment_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("enrollments.id", ondelete="RESTRICT"), nullable=True)
    planner_revision: Mapped[int] = mapped_column(default=1, server_default="1", nullable=False)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="targets")
    student = relationship("StudentProfile")
    classroom = relationship("Classroom")
    
    __table_args__ = (
        Index("ix_planner_target_student", "student_id", "assignment_id"),
        UniqueConstraint("id", "assignment_id", name="uq_assignment_target_context"),
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student"),
        UniqueConstraint("assignment_id", "classroom_id", name="uq_assignment_classroom"),
    )
    
    def __repr__(self) -> str:
        return f"<AssignmentTarget(assignment_id={self.assignment_id}, student_id={self.student_id})>"
