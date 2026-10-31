"""Subject model for educational subjects."""

import enum
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class SubjectStatus(str, enum.Enum):
    """Subject status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class Subject(TimestampedUUIDModel):
    """Subject model representing an educational subject (asignatura)."""

    __tablename__ = "subjects"

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[SubjectStatus] = mapped_column(
        default=SubjectStatus.ACTIVE,
        nullable=False,
    )
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    curriculum_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    keywords: Mapped[list[str]] = mapped_column(ARRAY(String(100)), default=list, nullable=False)

    # Relationships
    courses = relationship("Course", back_populates="subject")

    __table_args__ = (
        UniqueConstraint("code", name="uq_subject_code"),
        UniqueConstraint("name", name="uq_subject_name"),
    )

    def __repr__(self) -> str:
        return f"<Subject(id={self.id}, code={self.code}, name={self.name})>"