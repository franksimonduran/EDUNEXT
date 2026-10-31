"""Academic movement history model."""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class AcademicMovementType(str, enum.Enum):
    """Supported academic movement types."""

    ENROLLMENT = "enrollment"
    TRANSFER = "transfer"
    WITHDRAWAL = "withdrawal"
    COMPLETION = "completion"
    REENTRY = "reentry"
    CORRECTION = "correction"


class AcademicMovement(TimestampedUUIDModel):
    """Immutable audit trail for enrollment lifecycle changes."""

    __tablename__ = "academic_movements"

    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    movement_type: Mapped[AcademicMovementType] = mapped_column(
        Enum(
            AcademicMovementType,
            values_callable=lambda x: [e.value for e in x],
            name="academicmovementtype",
        ),
        nullable=False,
    )
    source_enrollment_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("enrollments.id", ondelete="SET NULL"),
        nullable=True,
    )
    destination_enrollment_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("enrollments.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_classroom_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
    )
    destination_classroom_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
    )
    effective_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    authorized_by_user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
