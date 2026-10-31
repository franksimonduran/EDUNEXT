"""Access audit without report bodies, student responses or credentials."""

from sqlalchemy import ForeignKey, Index, String, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class ReportAccessEvent(TimestampedUUIDModel):
    __tablename__ = "report_access_events"
    institution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("institutions.id", ondelete="RESTRICT"))
    actor_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="RESTRICT"))
    report_code: Mapped[str] = mapped_column(String(80))
    definition_version: Mapped[int] = mapped_column()
    operation: Mapped[str] = mapped_column(String(20))
    data_status: Mapped[str] = mapped_column(String(50))
    __table_args__ = (
        CheckConstraint("operation IN ('read','export_csv') AND definition_version >= 1", name="ck_report_access_operation"),
        Index("ix_report_access_institution_created", "institution_id", "created_at"),
    )
