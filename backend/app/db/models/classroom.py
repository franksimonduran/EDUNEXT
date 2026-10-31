"""Classroom model."""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class Classroom(TimestampedUUIDModel):
    """Classroom model representing a physical or virtual classroom."""
    
    __tablename__ = "classrooms"
    
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    academic_year_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("academic_years.id", ondelete="SET NULL"),
        nullable=True,
    )
    grade_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("grades.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sections.id", ondelete="SET NULL"),
        nullable=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[Optional[int]] = mapped_column(nullable=True)
    capacity_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    institution = relationship("Institution", back_populates="classrooms")
    grade = relationship("Grade", back_populates="classrooms")
    section = relationship("Section", back_populates="classrooms")
    enrollments = relationship("Enrollment", back_populates="classroom")
    teacher_assignments = relationship("TeacherAssignment", back_populates="classroom")
    
    __table_args__ = (
        UniqueConstraint("institution_id", "academic_year_id", "code", name="uq_classroom_code"),
        UniqueConstraint(
            "institution_id",
            "academic_year_id",
            "grade_id",
            "section_id",
            name="uq_classroom_grade_section",
        ),
    )
    
    def __repr__(self) -> str:
        return f"<Classroom(id={self.id}, code={self.code}, display_name={self.display_name})>"