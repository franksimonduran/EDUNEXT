"""Enrollment model."""

from datetime import datetime
from typing import Optional
from uuid import uuid4
import enum

from sqlalchemy import Date, DateTime, ForeignKey, Index, String, text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class EnrollmentStatus(str, enum.Enum):
    """Enrollment status."""
    PENDING = "pending"
    ACTIVE = "active"
    TRANSFERRED = "transferred"
    WITHDRAWN = "withdrawn"
    COMPLETED = "completed"
    GRADUATED = "graduated"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


class Enrollment(TimestampedUUIDModel):
    """Student enrollment in a classroom."""
    
    __tablename__ = "enrollments"
    
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
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
    academic_year_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("academic_years.id", ondelete="CASCADE"),
        nullable=False,
    )
    period_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("academic_periods.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, values_callable=lambda x: [e.value for e in x]),
        default=EnrollmentStatus.PENDING,
        nullable=False,
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    effective_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    student = relationship("StudentProfile", back_populates="enrollments")
    institution = relationship("Institution", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")
    academic_year = relationship("AcademicYear")
    period = relationship("AcademicPeriod", back_populates="enrollments")
    
    __table_args__ = (
        Index(
            "uq_enrollment_active_student_year",
            "student_id",
            "institution_id",
            "academic_year_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'active')"),
        ),
        Index("ix_enrollments_institution_year", "institution_id", "academic_year_id"),
        Index("ix_enrollments_classroom_status", "classroom_id", "status"),
    )
    
    def __repr__(self) -> str:
        return f"<Enrollment(id={self.id}, student_id={self.student_id}, classroom_id={self.classroom_id})>"