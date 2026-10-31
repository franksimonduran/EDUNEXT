"""Institution model."""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampedUUIDModel


class Institution(Base):
    """Institution model representing an educational institution."""
    
    __tablename__ = "institutions"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, unique=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="America/Lima", nullable=False)
    default_language: Mapped[str] = mapped_column(String(10), default="es", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    
    # Relationships
    users = relationship("User", back_populates="institution")
    academic_years = relationship("AcademicYear", back_populates="institution")
    classrooms = relationship("Classroom", back_populates="institution")
    enrollments = relationship("Enrollment", back_populates="institution")
    teacher_assignments = relationship("TeacherAssignment", back_populates="institution")
    courses = relationship("Course", back_populates="institution")
    resources = relationship("Resource", back_populates="institution")
    practices = relationship("Practice", back_populates="institution")
    games = relationship("EducationalGame", back_populates="institution")
    
    def __repr__(self) -> str:
        return f"<Institution(id={self.id}, name={self.name}, code={self.code})>"