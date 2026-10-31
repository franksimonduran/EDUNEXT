"""Minimal AI policy/usage/reference practice; no prompts, replies, audio or transcripts."""

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class AIServiceConfiguration(TimestampedUUIDModel):
    __tablename__ = "ai_service_configurations"
    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"), unique=True)
    tutor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    translation_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    dictionary_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    provider_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    daily_user_limit: Mapped[int] = mapped_column(default=20)
    daily_institution_limit: Mapped[int] = mapped_column(default=200)
    max_input_characters: Mapped[int] = mapped_column(default=1000)
    max_output_tokens: Mapped[int] = mapped_column(default=256)
    revision: Mapped[int] = mapped_column(default=0)
    updated_by_user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    __table_args__ = (CheckConstraint("revision >= 0 AND daily_user_limit BETWEEN 1 AND 100 AND daily_institution_limit BETWEEN 1 AND 2000 AND max_input_characters BETWEEN 100 AND 1500 AND max_output_tokens BETWEEN 32 AND 512", name="ck_ai_policy_limits"),)


class AIUsageEvent(TimestampedUUIDModel):
    __tablename__ = "ai_usage_events"
    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    operation_id: Mapped[str] = mapped_column(UUID(as_uuid=False))
    request_fingerprint: Mapped[str] = mapped_column(String(64))
    service: Mapped[str] = mapped_column(String(30))
    provider_code: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(30), default="reserved")
    input_units: Mapped[int | None] = mapped_column(nullable=True)
    output_units: Mapped[int | None] = mapped_column(nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        UniqueConstraint("institution_id", "user_id", "operation_id", name="uq_ai_usage_operation"),
        CheckConstraint("service IN ('tutor','translation') AND status IN ('reserved','succeeded','provider_error','invalid_output')", name="ck_ai_usage_state"),
        CheckConstraint("(input_units IS NULL OR input_units >= 0) AND (output_units IS NULL OR output_units >= 0)", name="ck_ai_usage_units"),
        Index("ix_ai_usage_scope_created", "institution_id", "user_id", "created_at"),
        Index("ix_ai_usage_expiry", "expires_at"),
    )


class PronunciationSession(TimestampedUUIDModel):
    __tablename__ = "ai_pronunciation_sessions"
    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    dictionary_entry_id: Mapped[str] = mapped_column(String(80))
    language: Mapped[str] = mapped_column(String(5))
    status: Mapped[str] = mapped_column(String(30), default="reference_only")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        CheckConstraint("language IN ('es','en') AND status = 'reference_only'", name="ck_ai_pronunciation_reference"),
        Index("ix_ai_pronunciation_owner", "institution_id", "user_id", "expires_at"),
    )
