"""Add task context, private text submissions, audit and calendar.

Revision ID: phase42planner
Revises: phase41progress
"""

from uuid import NAMESPACE_URL, uuid5

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "phase42planner"
down_revision = "phase41progress"
branch_labels = None
depends_on = None


def identity_columns():
    return [sa.Column("id", UUID(as_uuid=False), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False)]


def ref(name, table, nullable=False):
    return sa.Column(name, UUID(as_uuid=False), sa.ForeignKey(table+".id", ondelete="RESTRICT"), nullable=nullable)


def upgrade():
    for name, table in [("institution_id", "institutions"), ("planner_classroom_id", "classrooms"),
                        ("academic_year_id", "academic_years"), ("academic_period_id", "academic_periods"), ("created_by_user_id", "users")]:
        op.add_column("assignments", sa.Column(name, UUID(as_uuid=False), nullable=True))
        op.create_foreign_key("fk_assignments_"+name, "assignments", table, [name], ["id"], ondelete="RESTRICT")
    op.add_column("assignments", sa.Column("planner_revision", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("assignment_targets", sa.Column("enrollment_id", UUID(as_uuid=False), nullable=True))
    op.create_foreign_key("fk_assignment_targets_enrollment", "assignment_targets", "enrollments", ["enrollment_id"], ["id"], ondelete="RESTRICT")
    op.add_column("assignment_targets", sa.Column("planner_revision", sa.Integer(), nullable=False, server_default="1"))
    op.create_table("assignment_versions", *identity_columns(), ref("assignment_id", "assignments"),
        sa.Column("version_number", sa.Integer(), nullable=False), sa.Column("snapshot", JSONB(), nullable=False),
        ref("published_by_user_id", "users"), sa.UniqueConstraint("assignment_id", "version_number", name="uq_assignment_version_number"))
    op.create_table("assignment_submissions", *identity_columns(), ref("target_id", "assignment_targets"),
        ref("assignment_version_id", "assignment_versions"), ref("previous_submission_id", "assignment_submissions", nullable=True),
        sa.Column("attempt_number", sa.Integer(), nullable=False), sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("response_text", sa.Text(), nullable=False), sa.Column("status", sa.String(30), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True), sa.Column("receipt", JSONB(), nullable=False),
        sa.UniqueConstraint("target_id", "attempt_number", name="uq_submission_target_attempt"),
        sa.CheckConstraint("attempt_number >= 1 AND revision >= 1", name="ck_submission_revision"),
        sa.CheckConstraint("status IN ('draft','submitted','late_submitted','revision_requested','feedback_available','closed')", name="ck_submission_status"))
    op.create_table("assignment_feedback", *identity_columns(), ref("submission_id", "assignment_submissions"), ref("reviewer_user_id", "users"),
        sa.Column("feedback_text", sa.Text(), nullable=False), sa.Column("requests_revision", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False), sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft','published')", name="ck_assignment_feedback_status"))
    op.create_table("planner_audit", *identity_columns(), ref("institution_id", "institutions"), ref("actor_user_id", "users"),
        sa.Column("resource_id", UUID(as_uuid=False), nullable=False), sa.Column("operation", sa.String(60), nullable=False), sa.Column("details", JSONB(), nullable=False))
    op.create_table("calendar_events", *identity_columns(), ref("institution_id", "institutions"),
        ref("classroom_id", "classrooms", nullable=True), ref("course_id", "courses", nullable=True), ref("created_by_user_id", "users"),
        sa.Column("title", sa.String(255), nullable=False), sa.Column("description", sa.Text(), nullable=False),
        sa.Column("scope", sa.String(20), nullable=False), sa.Column("all_day", sa.Boolean(), nullable=False),
        sa.Column("starts_on", sa.Date(), nullable=True), sa.Column("ends_on", sa.Date(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True), sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False), sa.Column("revision", sa.Integer(), nullable=False),
        sa.CheckConstraint("scope IN ('institution','classroom','course')", name="ck_calendar_scope"),
        sa.CheckConstraint("status IN ('published','cancelled') AND revision >= 1", name="ck_calendar_state"),
        sa.CheckConstraint("(scope = 'institution' AND classroom_id IS NULL AND course_id IS NULL) OR (scope = 'classroom' AND classroom_id IS NOT NULL AND course_id IS NULL) OR (scope = 'course' AND classroom_id IS NOT NULL AND course_id IS NOT NULL)", name="ck_calendar_audience"),
        sa.CheckConstraint("(all_day AND starts_on IS NOT NULL AND ends_on IS NOT NULL AND ends_on > starts_on AND starts_at IS NULL AND ends_at IS NULL) OR (NOT all_day AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at AND starts_on IS NULL AND ends_on IS NULL)", name="ck_calendar_dates"))
    for code in ["assignments.create_assigned", "assignments.update_assigned", "assignments.publish_assigned", "assignments.read_assigned", "assignments.read_own",
                 "submissions.create_own", "submissions.read_assigned", "submissions.review_assigned", "calendar.read_own", "calendar.manage_assigned", "calendar.manage_institution"]:
        resource, action = code.split(".", 1)
        op.execute(sa.text("""INSERT INTO permissions (id, code, name, resource, action, scope, created_at, updated_at)
            SELECT :id, :code, :code, :resource, :action, 'institution', now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code=:code)""").bindparams(
                id=uuid5(NAMESPACE_URL, "aithron.edu/permissions/"+code), code=code, resource=resource, action=action))


def downgrade():
    raise RuntimeError("Planner submissions and audit must be preserved; explicit archival plan required")
