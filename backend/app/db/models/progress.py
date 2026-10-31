"""Learning progress models."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, Float, UniqueConstraint, func, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class LearningProgress(TimestampedUUIDModel):
    """Student learning progress for lessons and courses."""
    
    __tablename__ = "learning_progress"
    
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    lesson_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=True,
    )
    unit_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=True,
    )
    course_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=True,
    )
    
    status: Mapped[str] = mapped_column(
        String(20),
        default="not_started",
        nullable=False,
    )
    progress_percentage: Mapped[float] = mapped_column(default=0.0, nullable=False)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    time_spent_seconds: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Details
    blocks_completed: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    last_block_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    last_position: Mapped[Optional[int]] = mapped_column(nullable=True)
    
    # Metadata
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    student = relationship("StudentProfile")
    lesson = relationship("Lesson")
    unit = relationship("Unit")
    course = relationship("Course")
    
    __table_args__ = (
        UniqueConstraint("student_id", "lesson_id", name="uq_progress_student_lesson"),
        UniqueConstraint("student_id", "unit_id", name="uq_progress_student_unit"),
        UniqueConstraint("student_id", "course_id", name="uq_progress_student_course"),
    )
    
    def __repr__(self) -> str:
        return f"<LearningProgress(student_id={self.student_id}, lesson_id={self.lesson_id}, status={self.status})>"