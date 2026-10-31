"""Add planner integrity checks, query indexes and aggregate permission; preserve data."""

from uuid import NAMESPACE_URL, uuid5

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "phase42integrity"
down_revision = "phase42planner"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("assignment_submissions", sa.Column("assignment_id", UUID(as_uuid=False), nullable=True))
    op.execute("""UPDATE assignment_submissions AS s SET assignment_id = t.assignment_id
        FROM assignment_targets AS t WHERE s.target_id = t.id""")
    op.alter_column("assignment_submissions", "assignment_id", nullable=False)
    op.create_unique_constraint("uq_assignment_target_context", "assignment_targets", ["id", "assignment_id"])
    op.create_unique_constraint("uq_assignment_version_context", "assignment_versions", ["id", "assignment_id"])
    op.create_unique_constraint("uq_submission_previous_context", "assignment_submissions", ["id", "target_id"])
    op.create_foreign_key("fk_submission_target_context", "assignment_submissions", "assignment_targets",
        ["target_id", "assignment_id"], ["id", "assignment_id"], ondelete="RESTRICT")
    op.create_foreign_key("fk_submission_version_context", "assignment_submissions", "assignment_versions",
        ["assignment_version_id", "assignment_id"], ["id", "assignment_id"], ondelete="RESTRICT")
    op.create_foreign_key("fk_submission_previous_context", "assignment_submissions", "assignment_submissions",
        ["previous_submission_id", "target_id"], ["id", "target_id"], ondelete="RESTRICT")
    op.create_check_constraint("ck_assignment_version_positive", "assignment_versions", "version_number >= 1")
    op.create_check_constraint("ck_submission_received_state", "assignment_submissions",
        "(status = 'draft' AND submitted_at IS NULL) OR (status <> 'draft' AND submitted_at IS NOT NULL)")
    op.create_check_constraint("ck_feedback_publication_date", "assignment_feedback",
        "(status = 'draft' AND published_at IS NULL) OR (status = 'published' AND published_at IS NOT NULL)")
    for table, name, columns in [
        ("assignments", "ix_planner_assignment_scope_due", ["institution_id", "planner_classroom_id", "due_at"]),
        ("assignment_targets", "ix_planner_target_student", ["student_id", "assignment_id"]),
        ("assignment_feedback", "ix_planner_feedback_submission", ["submission_id", "status"]),
        ("calendar_events", "ix_planner_calendar_scope", ["institution_id", "classroom_id", "status"]),
        ("planner_audit", "ix_planner_audit_resource", ["institution_id", "resource_id", "created_at"]),
    ]:
        op.create_index(name, table, columns)
    for code in ["planner.read_institution_aggregates", "reinforcement.manage", "reinforcement.read_own"]:
        resource, action = code.split(".", 1)
        op.execute(sa.text("""INSERT INTO permissions (id, code, name, resource, action, scope, created_at, updated_at)
            SELECT :id, :code, :code, :resource, :action, 'institution', now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code=:code)""").bindparams(
                id=uuid5(NAMESPACE_URL, "aithron.edu/permissions/"+code), code=code, resource=resource, action=action))


def downgrade():
    raise RuntimeError("Planner integrity rollback requires an explicit data-preserving migration")
