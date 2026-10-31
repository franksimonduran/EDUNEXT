"""phase 37 academic organization

Revision ID: phase37academic
Revises: 5f0581f9d75b
Create Date: 2026-10-22 22:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "phase37academic"
down_revision: Union[str, None] = "5f0581f9d75b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE enrollmentstatus ADD VALUE IF NOT EXISTS 'completed'")
    op.execute("ALTER TYPE enrollmentstatus ADD VALUE IF NOT EXISTS 'cancelled'")

    op.drop_constraint("uq_classroom_grade_section", "classrooms", type_="unique")
    op.create_unique_constraint(
        "uq_classroom_grade_section",
        "classrooms",
        ["institution_id", "academic_year_id", "grade_id", "section_id"],
    )
    op.drop_constraint(
        "uq_enrollment_student_classroom_period",
        "enrollments",
        type_="unique",
    )

    op.add_column(
        "enrollments",
        sa.Column("academic_year_id", postgresql.UUID(as_uuid=False), nullable=True),
    )
    op.execute(
        """
        UPDATE enrollments
        SET academic_year_id = classrooms.academic_year_id
        FROM classrooms
        WHERE enrollments.classroom_id = classrooms.id
        """
    )
    op.alter_column(
        "enrollments",
        "academic_year_id",
        existing_type=postgresql.UUID(as_uuid=False),
        nullable=False,
    )
    op.create_foreign_key(
        "fk_enrollments_academic_year_id",
        "enrollments",
        "academic_years",
        ["academic_year_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_enrollments_institution_year",
        "enrollments",
        ["institution_id", "academic_year_id"],
        unique=False,
    )
    op.create_index(
        "ix_enrollments_classroom_status",
        "enrollments",
        ["classroom_id", "status"],
        unique=False,
    )
    op.create_index(
        "uq_enrollment_active_student_year",
        "enrollments",
        ["student_id", "institution_id", "academic_year_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'active')"),
    )

    movement_type = postgresql.ENUM(
        "enrollment",
        "transfer",
        "withdrawal",
        "completion",
        "reentry",
        "correction",
        name="academicmovementtype",
        create_type=False,
    )
    movement_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "academic_movements",
        sa.Column("institution_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("movement_type", movement_type, nullable=False),
        sa.Column("source_enrollment_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("destination_enrollment_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("source_classroom_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("destination_classroom_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("effective_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason_code", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("authorized_by_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["source_enrollment_id"], ["enrollments.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["destination_enrollment_id"], ["enrollments.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["source_classroom_id"], ["classrooms.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["destination_classroom_id"], ["classrooms.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["authorized_by_user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_academic_movements_institution_date",
        "academic_movements",
        ["institution_id", "effective_date"],
        unique=False,
    )
    op.create_index(
        "ix_academic_movements_student_date",
        "academic_movements",
        ["student_id", "effective_date"],
        unique=False,
    )

    op.create_table(
        "academic_idempotency_records",
        sa.Column("institution_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("operation", sa.String(length=60), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("request_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("resource_type", sa.String(length=60), nullable=False),
        sa.Column("resource_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "institution_id",
            "actor_user_id",
            "operation",
            "idempotency_key",
            name="uq_academic_idempotency_key",
        ),
    )


def downgrade() -> None:
    op.drop_table("academic_idempotency_records")
    op.drop_index("ix_academic_movements_student_date", table_name="academic_movements")
    op.drop_index("ix_academic_movements_institution_date", table_name="academic_movements")
    op.drop_table("academic_movements")
    postgresql.ENUM(name="academicmovementtype").drop(op.get_bind(), checkfirst=True)

    op.drop_index("uq_enrollment_active_student_year", table_name="enrollments")
    op.drop_index("ix_enrollments_classroom_status", table_name="enrollments")
    op.drop_index("ix_enrollments_institution_year", table_name="enrollments")
    op.drop_constraint("fk_enrollments_academic_year_id", "enrollments", type_="foreignkey")
    op.drop_column("enrollments", "academic_year_id")
    op.create_unique_constraint(
        "uq_enrollment_student_classroom_period",
        "enrollments",
        ["student_id", "classroom_id", "period_id"],
    )

    op.drop_constraint("uq_classroom_grade_section", "classrooms", type_="unique")
    op.create_unique_constraint(
        "uq_classroom_grade_section",
        "classrooms",
        ["institution_id", "grade_id", "section_id"],
    )
