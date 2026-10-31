"""Personal recognitions backed by a recorded lesson completion."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class StudentAchievement(TimestampedUUIDModel):
    __tablename__ = "student_achievements"

    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"))
    student_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("student_profiles.id", ondelete="RESTRICT"))
    source_progress_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("learning_progress.id", ondelete="RESTRICT"))
    code: Mapped[str] = mapped_column(String(50))
    rule_version: Mapped[int] = mapped_column(default=1)
    status: Mapped[str] = mapped_column(String(20), default="earned")
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    __table_args__ = (
        UniqueConstraint("institution_id", "student_id", "code", name="uq_student_achievement_code"),
        CheckConstraint("rule_version >= 1", name="ck_achievement_rule_version"),
        CheckConstraint("status IN ('earned', 'revoked')", name="ck_achievement_status"),
        CheckConstraint("code IN ('first_lesson', 'five_lessons')", name="ck_achievement_code"),
    )
