"""Teacher Assignment model."""

import enum
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class ResponsibilityType(str, enum.Enum):
    """Teacher responsibility type."""
    MAIN = "main"
    ASSISTANT = "assistant"
    SUBSTITUTE = "substitute"
    SPECIALIST = "specialist"


class TeacherAssignment(TimestampedUUIDModel):
    """Teacher assignment to a classroom and course."""
    
    __tablename__ = "teacher_assignments"
    
    monitor_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("monitor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    classroom_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    period_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("academic_periods.id", ondelete="SET NULL"),
        nullable=True,
    )
    responsibility: Mapped[ResponsibilityType] = mapped_column(
        Enum(ResponsibilityType, values_callable=lambda x: [e.value for e in x]),
        default=ResponsibilityType.MAIN,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    monitor = relationship("MonitorProfile", back_populates="assignments")
    institution = relationship("Institution", back_populates="teacher_assignments")
    classroom = relationship("Classroom", back_populates="teacher_assignments")
    course = relationship("Course", back_populates="teacher_assignments")
    period = relationship("AcademicPeriod", back_populates="teacher_assignments")
    
    __table_args__ = (
        UniqueConstraint(
            "monitor_id", "classroom_id", "course_id", "period_id",
            name="uq_teacher_assignment"
        ),
    )
    
    def __repr__(self) -> str:
        return f"<TeacherAssignment(id={self.id}, monitor_id={self.monitor_id}, course_id={self.course_id})>"