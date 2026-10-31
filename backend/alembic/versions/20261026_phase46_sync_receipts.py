"""Add minimal lesson sync receipts without altering historical progress."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "phase46receipts"
down_revision = "phase45ai"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("sync_operation_receipts",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("institution_id", UUID(as_uuid=False), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("actor_user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("client_operation_id", UUID(as_uuid=False), nullable=False),
        sa.Column("operation_type", sa.String(60), nullable=False),
        sa.Column("payload_digest", sa.String(64), nullable=False),
        sa.Column("server_resource_id", UUID(as_uuid=False), sa.ForeignKey("lessons.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("server_version", UUID(as_uuid=False), sa.ForeignKey("content_versions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("institution_id", "actor_user_id", "client_operation_id", name="uq_sync_receipt_actor_operation"),
        sa.CheckConstraint("operation_type = 'lesson.progress.complete'", name="ck_sync_receipt_operation"),
        sa.CheckConstraint("length(payload_digest) = 64", name="ck_sync_receipt_digest"))


def downgrade():
    raise RuntimeError("Receipt removal requires an explicit archival and duplicate-replay recovery policy")
