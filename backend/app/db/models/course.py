"""Course, Unit, and Lesson models."""

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class Course(TimestampedUUIDModel):
    """Course model representing an academic course."""
    
    __tablename__ = "courses"
    
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    grade_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("grades.id", ondelete="CASCADE"),
        nullable=False,
    )
    subject_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    visibility: Mapped[str] = mapped_column(String(20), default="institution", nullable=False)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    
    # Relationships
    institution = relationship("Institution", back_populates="courses")
    grade = relationship("Grade", back_populates="courses")
    subject = relationship("Subject", back_populates="courses")
    units = relationship("Unit", back_populates="course", order_by="Unit.sequence")
    teacher_assignments = relationship("TeacherAssignment", back_populates="course")
    resources = relationship("Resource", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")
    practices = relationship("Practice", back_populates="course")
    
    __table_args__ = (
        UniqueConstraint("institution_id", "grade_id", "code", name="uq_course_institution_code"),
    )
    
    def __repr__(self) -> str:
        return f"<Course(id={self.id}, code={self.code}, name={self.name})>"


class Unit(TimestampedUUIDModel):
    """Unit within a course."""
    
    __tablename__ = "units"
    
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objectives: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    estimated_hours: Mapped[Optional[int]] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="units")
    lessons = relationship("Lesson", back_populates="unit", order_by="Lesson.sequence")
    assessments = relationship("Assessment", back_populates="unit")
    practices = relationship("Practice", back_populates="unit")
    
    __table_args__ = (
        UniqueConstraint("course_id", "sequence", name="uq_unit_course_sequence"),
    )
    
    def __repr__(self) -> str:
        return f"<Unit(id={self.id}, title={self.title}, course_id={self.course_id})>"


class Lesson(TimestampedUUIDModel):
    """Lesson within a unit."""
    
    __tablename__ = "lessons"
    
    unit_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objectives: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    duration_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    estimated_time_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    
    # Content structure (JSONB for flexible blocks)
    blocks: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    
    # Metadata
    tags: Mapped[list] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    keywords: Mapped[list] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    learning_objectives: Mapped[list] = mapped_column(ARRAY(String(255)), default=list, nullable=False)
    prerequisites: Mapped[list] = mapped_column(ARRAY(String(255)), default=list, nullable=False)
    
    # Relationships
    unit = relationship("Unit", back_populates="lessons")
    resources = relationship("LessonResource", back_populates="lesson")
    assessment_questions = relationship("AssessmentQuestion", back_populates="lesson")
    practices = relationship("Practice", back_populates="lesson")
    
    def __repr__(self) -> str:
        return f"<Lesson(id={self.id}, title={self.title}, unit_id={self.unit_id})>"