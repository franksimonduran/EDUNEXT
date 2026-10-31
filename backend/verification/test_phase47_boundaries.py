"""Real ASGI routing/serialization over synthetic dependencies; never a database E2E."""

from collections import Counter
from datetime import datetime, timezone
from types import SimpleNamespace
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4
import warnings

from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
import pytest
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.main import create_app
from app.core.config import settings
from app.dependencies.auth import get_authorization_context
from app.api.v1.endpoints import insights, sync
from app.schemas.sync import SyncReceiptRead


@pytest.fixture
def app(monkeypatch):
    # Any unintended SQL/network DB access fails rather than reaching a configured DB.
    monkeypatch.setattr(Engine, "connect", lambda *a, **k: pytest.fail("Unexpected DB connection"))
    monkeypatch.setattr(AsyncSession, "execute", AsyncMock(side_effect=AssertionError("Unexpected SQL")))
    monkeypatch.setattr(settings, "SYNC_ENABLED", False)
    monkeypatch.setattr(settings, "SYNC_PROTOCOL_V1_ENABLED", False)
    return create_app()


def test_openapi_has_no_duplicate_route_or_operation_id(app):
    def mounted_routes(router):
        for route in router.routes:
            if isinstance(route, APIRoute):
                yield route
            elif hasattr(route, "original_router"):
                yield from mounted_routes(route.original_router)
    routes = list(mounted_routes(app.router))
    assert routes
    pairs = Counter((method, route.path) for route in routes for method in route.methods)
    assert not {key: count for key, count in pairs.items() if count > 1}
    with warnings.catch_warnings(record=True) as reported:
        warnings.simplefilter("always")
        schema = app.openapi()
    assert not [w for w in reported if "Duplicate Operation ID" in str(w.message)]
    ids = [operation["operationId"] for path in schema["paths"].values()
           for method, operation in path.items() if method in {"get", "post", "put", "patch", "delete"}]
    assert len(ids) == len(set(ids))
    assert "/api/v1/sync/operations" in schema["paths"]
    assert "/api/v1/insights/rules/catalog" in schema["paths"]


def test_liveness_without_lifespan_is_not_database_readiness(app):
    assert TestClient(app, base_url="http://localhost").get("/api/v1/health/live").status_code == 200


def test_migration_source_graph_has_one_head_without_applying_it():
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    config = Config()
    config.set_main_option("script_location", str(Path(__file__).parents[1] / "alembic"))
    scripts = ScriptDirectory.from_config(config)
    assert scripts.get_heads() == ["phase46receipts"]
    assert list(scripts.walk_revisions())


@pytest.mark.parametrize("path", ["/ai/capabilities", "/reports/catalog", "/insights/rules/catalog", "/sync/status"])
def test_protected_boundaries_require_authentication(app, path):
    response = TestClient(app, base_url="http://localhost").get("/api/v1" + path)
    assert response.status_code == 401


@pytest.fixture
def authenticated(app):
    context = SimpleNamespace(user_id=uuid4(), institution_id=uuid4(), permissions=[])
    session = SimpleNamespace(commit=AsyncMock(), rollback=AsyncMock())

    async def db():
        yield session

    app.dependency_overrides[get_authorization_context] = lambda: context
    app.dependency_overrides[sync.sync_database] = db
    app.dependency_overrides[insights.report_database] = db
    return context, session, TestClient(app, base_url="http://localhost")


def payload(context):
    return {"expected_account_id": str(context.user_id), "expected_institution_id": str(context.institution_id),
            "operations": [{"client_operation_id": str(uuid4()), "operation_type": "lesson.progress.complete",
                            "schema_version": 1, "resource_id": str(uuid4()), "lesson_version_id": str(uuid4())}]}


def test_sync_is_disabled_by_default(authenticated):
    context, session, client = authenticated
    response = client.post("/api/v1/sync/operations", json=payload(context))
    assert response.status_code == 503
    session.commit.assert_not_awaited()


def test_sync_account_change_is_not_reassignment(authenticated, monkeypatch):
    context, session, client = authenticated
    monkeypatch.setattr(settings, "SYNC_ENABLED", True)
    monkeypatch.setattr(settings, "SYNC_PROTOCOL_V1_ENABLED", True)
    body = payload(context)
    body["expected_account_id"] = str(uuid4())
    assert client.post("/api/v1/sync/operations", json=body).status_code == 409
    session.commit.assert_not_awaited()


@pytest.mark.parametrize("invalid", ["score", "achievement_level", "permissions"])
def test_sync_privileged_fields_rejected_over_http(authenticated, monkeypatch, invalid):
    context, session, client = authenticated
    monkeypatch.setattr(settings, "SYNC_ENABLED", True)
    monkeypatch.setattr(settings, "SYNC_PROTOCOL_V1_ENABLED", True)
    body = payload(context)
    body["operations"][0][invalid] = "AD"
    assert client.post("/api/v1/sync/operations", json=body).status_code == 422
    session.commit.assert_not_awaited()


def test_sync_commit_failure_does_not_confirm(authenticated, monkeypatch):
    context, session, client = authenticated
    monkeypatch.setattr(settings, "SYNC_ENABLED", True)
    monkeypatch.setattr(settings, "SYNC_PROTOCOL_V1_ENABLED", True)
    body = payload(context)
    operation = body["operations"][0]
    pending = SyncReceiptRead(client_operation_id=operation["client_operation_id"], status="applied",
                             server_resource_id=operation["resource_id"], server_version=operation["lesson_version_id"],
                             confirmed_at=datetime.now(timezone.utc))
    monkeypatch.setattr(sync.SyncService, "apply", AsyncMock(return_value=pending))
    session.commit.side_effect = SQLAlchemyError("SYNTHETIC SQL DETAILS MUST NOT LEAK")
    response = client.post("/api/v1/sync/operations", json=body)
    assert response.status_code == 200
    assert response.json()[0]["status"] == "retryable"
    assert response.json()[0]["confirmed_at"] is None
    assert "SYNTHETIC SQL" not in response.text
    session.rollback.assert_awaited_once()


def test_insights_does_not_bypass_report_permission(authenticated):
    _, session, client = authenticated
    response = client.get("/api/v1/insights/me/activities")
    assert response.status_code == 403
    session.commit.assert_not_awaited()


def test_insights_rejects_institution_override(authenticated):
    _, _, client = authenticated
    assert client.get("/api/v1/insights/me/activities", params={"institution_id": str(uuid4())}).status_code == 422


def test_sync_transport_bound_runs_before_operation_execution(app):
    response = TestClient(app, base_url="http://localhost").post("/api/v1/sync/operations", content=b"x" * 16385)
    assert response.status_code == 413
    assert response.json()["code"] == "SYNC_BODY_LIMIT"
