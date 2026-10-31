"""Grade and Section models."""

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class Grade(TimestampedUUIDModel):
    """Grade level model."""
    
    __tablename__ = "grades"
    
    number: Mapped[int] = mapped_column(unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    
    # Relationships
    sections = relationship("Section", back_populates="grade")
    courses = relationship("Course", back_populates="grade")
    classrooms = relationship("Classroom", back_populates="grade")
    
    def __repr__(self) -> str:
        return f"<Grade(id={self.id}, number={self.number}, name={self.name})>"


class Section(TimestampedUUIDModel):
    """Section within a grade."""
    
    __tablename__ = "sections"
    
    grade_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("grades.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(10), nullable=False)
    name_short: Mapped[str] = mapped_column(String(5), nullable=True)
    capacity: Mapped[Optional[int]] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    
    # Relationships
    grade = relationship("Grade", back_populates="sections")
    classrooms = relationship("Classroom", back_populates="section")
    
    __table_args__ = (
        UniqueConstraint("grade_id", "name", name="uq_section_grade_name"),
    )
    
    def __repr__(self) -> str:
        return f"<Section(id={self.id}, name={self.name}, grade_id={self.grade_id})>"