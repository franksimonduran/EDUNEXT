"""Alembic environment configuration."""

import sys
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool, create_engine
from sqlalchemy.engine import Connection

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.connection_options import database_connection
from app.db.base import Base

# Import all models to ensure they are registered with Base.metadata
from app.db.models import (
    Institution,
    User,
    UserProfile,
    StudentProfile,
    MonitorProfile,
    AdministratorProfile,
    Role,
    Permission,
    RolePermission,
    UserRole,
    AcademicYear,
    AcademicPeriod,
    Grade,
    Section,
    Classroom,
    Enrollment,
    AcademicMovement,
    AcademicIdempotencyRecord,
    TeacherAssignment,
    Course,
    Unit,
    Lesson,
    ContentVersion,
    Resource,
    LessonResource,
    Assessment,
    AssessmentQuestion,
    AssessmentAttempt,
    AssessmentResponse,
    AssessmentResult,
    LearningProgress,
    Assignment,
    AssignmentTarget,
    ReinforcementPlan,
    UserCredential,
    AuthSession,
    RefreshToken,
    SecurityEvent,
)

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the SQLAlchemy URL from settings
# Use sync URL for autogenerate (offline mode)
sync_url, sync_connect_args = database_connection(settings, asynchronous=False)
# ConfigParser interprets percent signs; encoded credentials must not become interpolation.
config.set_main_option("sqlalchemy.url", sync_url.render_as_string(hide_password=False).replace("%", "%%"))

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with sync engine."""
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
        connect_args=sync_connect_args,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)


# Use offline mode when Alembic requests SQL generation and online mode otherwise.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
