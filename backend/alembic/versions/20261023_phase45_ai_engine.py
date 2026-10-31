"""AI policies, minimal usage reservations and reference-only oral practice."""

from uuid import NAMESPACE_URL, uuid5
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "phase45ai"
down_revision = "phase43reports"
branch_labels = None
depends_on = None


def identities():
    return [sa.Column("id", UUID(as_uuid=False), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False)]


def reference(name, table, nullable=False):
    return sa.Column(name, UUID(as_uuid=False), sa.ForeignKey(table+".id", ondelete="RESTRICT"), nullable=nullable)


def upgrade():
    op.create_table("ai_service_configurations", *identities(), reference("institution_id", "institutions"),
        sa.Column("tutor_enabled", sa.Boolean(), nullable=False), sa.Column("translation_enabled", sa.Boolean(), nullable=False),
        sa.Column("dictionary_enabled", sa.Boolean(), nullable=False), sa.Column("provider_approved", sa.Boolean(), nullable=False),
        sa.Column("daily_user_limit", sa.Integer(), nullable=False), sa.Column("daily_institution_limit", sa.Integer(), nullable=False),
        sa.Column("max_input_characters", sa.Integer(), nullable=False), sa.Column("max_output_tokens", sa.Integer(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False), reference("updated_by_user_id", "users", nullable=True),
        sa.UniqueConstraint("institution_id"),
        sa.CheckConstraint("revision >= 0 AND daily_user_limit BETWEEN 1 AND 100 AND daily_institution_limit BETWEEN 1 AND 2000 AND max_input_characters BETWEEN 100 AND 1500 AND max_output_tokens BETWEEN 32 AND 512", name="ck_ai_policy_limits"))
    op.create_table("ai_usage_events", *identities(), reference("institution_id", "institutions"), reference("user_id", "users"),
        sa.Column("operation_id", UUID(as_uuid=False), nullable=False), sa.Column("request_fingerprint", sa.String(64), nullable=False),
        sa.Column("service", sa.String(30), nullable=False), sa.Column("provider_code", sa.String(40), nullable=False),
        sa.Column("status", sa.String(30), nullable=False), sa.Column("input_units", sa.Integer(), nullable=True),
        sa.Column("output_units", sa.Integer(), nullable=True), sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("institution_id", "user_id", "operation_id", name="uq_ai_usage_operation"),
        sa.CheckConstraint("service IN ('tutor','translation') AND status IN ('reserved','succeeded','provider_error','invalid_output')", name="ck_ai_usage_state"),
        sa.CheckConstraint("(input_units IS NULL OR input_units >= 0) AND (output_units IS NULL OR output_units >= 0)", name="ck_ai_usage_units"))
    op.create_index("ix_ai_usage_scope_created", "ai_usage_events", ["institution_id", "user_id", "created_at"])
    op.create_index("ix_ai_usage_expiry", "ai_usage_events", ["expires_at"])
    op.create_table("ai_pronunciation_sessions", *identities(), reference("institution_id", "institutions"), reference("user_id", "users"),
        sa.Column("dictionary_entry_id", sa.String(80), nullable=False), sa.Column("language", sa.String(5), nullable=False),
        sa.Column("status", sa.String(30), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("language IN ('es','en') AND status = 'reference_only'", name="ck_ai_pronunciation_reference"))
    op.create_index("ix_ai_pronunciation_owner", "ai_pronunciation_sessions", ["institution_id", "user_id", "expires_at"])
    for code in ("ai.tutor.use_own", "ai.tutor.use_assigned_context", "ai.translate.use_own", "ai.translate.use",
        "ai.dictionary.read", "ai.pronunciation.use_own", "ai.config.read_institution", "ai.config.manage_institution",
        "ai.usage.read_own", "ai.usage.read_institution_aggregates"):
        resource, action = code.split(".", 1)
        op.execute(sa.text("""INSERT INTO permissions (id, code, name, resource, action, scope, created_at, updated_at)
            SELECT :id, :code, :code, :resource, :action, 'institution', now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code=:code)""").bindparams(
                id=uuid5(NAMESPACE_URL, "aithron.edu/permissions/"+code), code=code, resource=resource, action=action))


def downgrade():
    raise RuntimeError("AI usage/configuration rollback requires an explicit retention and archival decision")
