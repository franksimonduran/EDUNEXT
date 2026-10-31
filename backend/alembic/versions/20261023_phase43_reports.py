"""Reports permissions and minimal access audit, no academic data copies."""

from uuid import NAMESPACE_URL, uuid5
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "phase43reports"
down_revision = "phase42integrity"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("report_access_events",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("institution_id", UUID(as_uuid=False), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("actor_user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("report_code", sa.String(80), nullable=False),
        sa.Column("definition_version", sa.Integer(), nullable=False),
        sa.Column("operation", sa.String(20), nullable=False),
        sa.Column("data_status", sa.String(50), nullable=False),
        sa.CheckConstraint("operation IN ('read','export_csv') AND definition_version >= 1", name="ck_report_access_operation"))
    op.create_index("ix_report_access_institution_created", "report_access_events", ["institution_id", "created_at"])
    for code in ("reports.read_own", "reports.export_own", "reports.read_assigned", "reports.export_assigned",
                 "reports.read_institution_aggregates", "reports.export_institution_aggregates"):
        resource, action = code.split(".", 1)
        op.execute(sa.text("""INSERT INTO permissions (id, code, name, resource, action, scope, created_at, updated_at)
            SELECT :id, :code, :code, :resource, :action, 'institution', now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code=:code)""").bindparams(
                id=uuid5(NAMESPACE_URL, "aithron.edu/permissions/"+code), code=code, resource=resource, action=action))


def downgrade():
    raise RuntimeError("Report audit retention requires an explicit non-destructive archival policy")
