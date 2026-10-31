"""Test configuration and fixtures."""

import asyncio
import os
from urllib.parse import urlsplit

# This suite recreates its schema. Never fall back to a possibly shared database.
_test_url = os.environ.get('TEST_DATABASE_URL', '')
_database_name = urlsplit(_test_url).path.lstrip('/')
if (
    not _test_url.startswith('postgresql+asyncpg://')
    or not _database_name.endswith('_test')
    or os.environ.get('AITHRON_ALLOW_TEST_SCHEMA_RESET') != _database_name
):
    raise RuntimeError(
        'Pruebas destructivas bloqueadas: configura TEST_DATABASE_URL con una base '
        'PostgreSQL aislada terminada en _test y AITHRON_ALLOW_TEST_SCHEMA_RESET '
        'con el nombre exacto de esa base. No se ha modificado ningún esquema.'
    )

os.environ["APP_ENV"] = "test"
os.environ["DEBUG"] = "false"
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/athron_edu_test",
)

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import create_app
from app.core.security import hash_password
from app.db.engine import AsyncSessionLocal, async_engine
from app.db.models import (
    Base,
    CredentialStatus,
    Institution,
    User,
    UserCredential,
    UserRole,
    UserStatus,
)
from app.services.academic_seed import ensure_default_grades
from app.services.role_seed import ensure_system_roles


ADMIN_PASSWORD = "Testing-Admin-Passphrase-2026!"
ADMIN_ONE = {"email": "admin1@athron.edu", "username": "admin1"}
ADMIN_TWO = {"email": "admin2@athron.edu", "username": "admin2"}


async def _create_admin(session, institution, email: str, username: str, roles) -> None:
    user = User(
        institution_id=str(institution.id),
        username=username,
        display_name=f"Admin {username}",
        email=email,
        status=UserStatus.ACTIVE,
    )
    session.add(user)
    await session.flush()

    session.add(
        UserCredential(
            user_id=str(user.id),
            password_hash=hash_password(ADMIN_PASSWORD),
            password_algorithm="argon2id",
            status=CredentialStatus.ACTIVE,
        )
    )
    session.add(
        UserRole(
            user_id=str(user.id),
            role_id=str(roles["ADMIN"].id),
            institution_id=str(institution.id),
            is_active=True,
        )
    )


async def _prepare_database() -> None:
    async with async_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        roles = await ensure_system_roles(session)
        await ensure_default_grades(session)

        institution_one = Institution(
            name="Institution One",
            code="INST-ONE",
            timezone="America/Lima",
            default_language="es",
            status="active",
        )
        institution_two = Institution(
            name="Institution Two",
            code="INST-TWO",
            timezone="America/Lima",
            default_language="es",
            status="active",
        )
        session.add_all([institution_one, institution_two])
        await session.flush()

        await _create_admin(session, institution_one, ADMIN_ONE["email"], ADMIN_ONE["username"], roles)
        await _create_admin(session, institution_two, ADMIN_TWO["email"], ADMIN_TWO["username"], roles)
        await session.commit()

    await async_engine.dispose()


def pytest_sessionstart(session) -> None:
    asyncio.run(_prepare_database())


def pytest_sessionfinish(session, exitstatus) -> None:
    asyncio.run(async_engine.dispose())


@pytest.fixture(scope="session")
def app():
    """Create application for testing."""
    return create_app()


@pytest.fixture
def client(app):
    """Create synchronous test client for legacy tests."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client(app):
    """Create async test client for async tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        try:
            yield ac
        finally:
            await async_engine.dispose()


@pytest.fixture(autouse=True)
def clear_rate_limiter():
    from app.dependencies.auth import rate_limiter

    rate_limiter.attempts.clear()
    yield
    rate_limiter.attempts.clear()
