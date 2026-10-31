"""Academic period models."""

from datetime import datetime, date
from typing import Optional, List
from uuid import uuid4
import enum

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class PeriodType(str, enum.Enum):
    """Academic period type."""
    SEMESTER = "semester"
    TRIMESTER = "trimester"
    QUARTER = "quarter"
    BIMESTER = "bimester"
    CUSTOM = "custom"


class AcademicYear(TimestampedUUIDModel):
    """Academic year model."""
    
    __tablename__ = "academic_years"
    
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    year: Mapped[int] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    
    # Relationships
    institution = relationship("Institution", back_populates="academic_years")
    periods = relationship("AcademicPeriod", back_populates="academic_year")
    
    __table_args__ = (
        UniqueConstraint("institution_id", "year", name="uq_academic_year_institution"),
    )
    
    def __repr__(self) -> str:
        return f"<AcademicYear(id={self.id}, year={self.year}, institution_id={self.institution_id})>"


class AcademicPeriod(TimestampedUUIDModel):
    """Academic period within an academic year."""
    
    __tablename__ = "academic_periods"
    
    academic_year_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("academic_years.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    period_type: Mapped[PeriodType] = mapped_column(
        Enum(PeriodType, values_callable=lambda x: [e.value for e in x]),
        default=PeriodType.SEMESTER,
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    sequence: Mapped[int] = mapped_column(default=1, nullable=False)
    
    # Relationships
    academic_year = relationship("AcademicYear", back_populates="periods")
    enrollments = relationship("Enrollment", back_populates="period")
    teacher_assignments = relationship("TeacherAssignment", back_populates="period")
    assessments = relationship("Assessment", back_populates="period")
    
    __table_args__ = (
        UniqueConstraint("academic_year_id", "sequence", name="uq_period_sequence"),
    )
    
    def __repr__(self) -> str:
        return f"<AcademicPeriod(id={self.id}, name={self.name}, period_type={self.period_type})>"