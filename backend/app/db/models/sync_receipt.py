"""Minimal durable receipt; no offline answers or academic grades are copied."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class SyncOperationReceipt(TimestampedUUIDModel):
    __tablename__ = "sync_operation_receipts"

    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    actor_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    client_operation_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    operation_type: Mapped[str] = mapped_column(String(60), nullable=False)
    payload_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    server_resource_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("lessons.id", ondelete="RESTRICT"), nullable=False)
    server_version: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("content_versions.id", ondelete="RESTRICT"), nullable=False)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("institution_id", "actor_user_id", "client_operation_id", name="uq_sync_receipt_actor_operation"),
        CheckConstraint("operation_type = 'lesson.progress.complete'", name="ck_sync_receipt_operation"),
        CheckConstraint("length(payload_digest) = 64", name="ck_sync_receipt_digest"),
    )
