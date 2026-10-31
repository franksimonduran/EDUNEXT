"""Add personal recognitions without altering existing progress or academic data.

Revision ID: phase41progress
Revises: 21d890e192ab
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "phase41progress"
down_revision = "21d890e192ab"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("student_achievements",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("institution_id", UUID(as_uuid=False), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("student_id", UUID(as_uuid=False), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("source_progress_id", UUID(as_uuid=False), sa.ForeignKey("learning_progress.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("code", sa.String(50), nullable=False), sa.Column("rule_version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("institution_id", "student_id", "code", name="uq_student_achievement_code"),
        sa.CheckConstraint("rule_version >= 1", name="ck_achievement_rule_version"),
        sa.CheckConstraint("status IN ('earned', 'revoked')", name="ck_achievement_status"),
        sa.CheckConstraint("code IN ('first_lesson', 'five_lessons')", name="ck_achievement_code"),
    )
    # Catalog the permission, but grant it to no role/user automatically.
    op.execute("""INSERT INTO permissions (id, code, name, resource, action, scope, created_at, updated_at)
        SELECT 'e4166da0-9824-424c-99f7-bca5eccd0d41'::uuid, 'progress.record_own_activity',
        'Record own lesson activity', 'progress', 'record_own_activity', 'own', now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='progress.record_own_activity')""")
    op.execute("""INSERT INTO permissions (id, code, name, resource, action, scope, created_at, updated_at)
        SELECT 'e4166da0-9824-424c-99f7-bca5eccd0d42'::uuid, 'progress.read_institution_aggregates',
        'Read institution progress aggregates', 'progress', 'read_institution_aggregates', 'institution', now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='progress.read_institution_aggregates')""")


def downgrade():
    raise RuntimeError("Recognition history must be preserved; downgrade requires an explicit archival plan")
