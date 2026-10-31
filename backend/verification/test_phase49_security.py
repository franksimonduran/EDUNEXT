"""Non-destructive unit tests; no real DB, cloud, backup or container is started."""
import json
import logging
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.config import Settings
from app.core.logging import SafeJSONFormatter
from app.api.v1.endpoints import health
from app.db.connection_options import database_connection


class InfrastructureConfiguration(unittest.TestCase):
    def test_structurally_secure_staging_configuration(self):
        settings = Settings(_env_file=None, APP_ENV="staging", DEBUG=False,
            DATABASE_URL="postgresql+asyncpg://app:fictional@database.example.invalid/aithron_staging",
            SECRET_KEY="a" * 64, CSRF_SECRET_KEY="b" * 64, COOKIE_SECURE=True,
            CORS_ORIGINS="https://staging.example.invalid", TRUSTED_HOSTS="staging.example.invalid",
            DATABASE_SSL_MODE="verify-full", DATABASE_SSL_CA_FILE="/fixture-ca.pem",
            EXPECTED_ALEMBIC_REVISION="phase45ai")
        self.assertEqual(settings.APP_ENV, "staging")

    def test_unknown_environment_rejected(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, APP_ENV="unknown")

    def test_non_postgresql_url_rejected(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, DATABASE_URL="sqlite:///not-supported")

    def test_driver_specific_tls_query_rejected(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, DATABASE_URL="postgresql://app:fictional@localhost/test?sslmode=disable")

    def test_sync_and_async_share_tls_policy(self):
        settings = Settings(_env_file=None, APP_ENV="test", DATABASE_URL="postgresql+asyncpg://app:fictional@localhost/aithron_test")
        sync_url, sync_args = database_connection(settings, asynchronous=False)
        async_url, async_args = database_connection(settings, asynchronous=True)
        self.assertEqual(sync_url.drivername, "postgresql+psycopg2")
        self.assertEqual(async_url.drivername, "postgresql+asyncpg")
        self.assertEqual(sync_args["sslmode"], "disable")
        self.assertIs(async_args["ssl"], False)

    def test_formatter_omits_secrets_paths_and_exception_values(self):
        record = logging.LogRecord("test", logging.ERROR, "", 1, "secret-fixture-value", (), None)
        record.password = "secret-fixture-value"
        record.path = "/private/child-name"
        rendered = SafeJSONFormatter().format(record)
        self.assertNotIn("secret-fixture-value", rendered)
        self.assertNotIn("child-name", rendered)
        self.assertEqual(json.loads(rendered)["event"], "application_event")


class Readiness(unittest.IsolatedAsyncioTestCase):
    async def test_matching_revision_is_ready(self):
        connection = AsyncMock()
        version_result = MagicMock()
        version_result.scalars.return_value.all.return_value = ["expected-version"]
        connection.execute.side_effect = [MagicMock(), version_result]
        engine = MagicMock()
        engine.connect.return_value.__aenter__ = AsyncMock(return_value=connection)
        with patch.object(health, "async_engine", engine), patch.object(health, "settings", SimpleNamespace(HEALTHCHECK_TIMEOUT_SECONDS=1, EXPECTED_ALEMBIC_REVISION="expected-version")):
            self.assertEqual(await health.readiness(), {"status": "ready"})

    async def test_database_failure_is_generic_503(self):
        engine = MagicMock()
        engine.connect.return_value.__aenter__ = AsyncMock(side_effect=RuntimeError("private fixture exception"))
        with patch.object(health, "async_engine", engine):
            response = await health.readiness()
        self.assertEqual(response.status_code, 503)
        self.assertNotIn(b"private", response.body)

    async def test_revision_mismatch_is_not_ready(self):
        connection = AsyncMock()
        version_result = MagicMock()
        version_result.scalars.return_value.all.return_value = ["old-version"]
        connection.execute.side_effect = [MagicMock(), version_result]
        engine = MagicMock()
        engine.connect.return_value.__aenter__ = AsyncMock(return_value=connection)
        with patch.object(health, "async_engine", engine), patch.object(health, "settings", SimpleNamespace(HEALTHCHECK_TIMEOUT_SECONDS=1, EXPECTED_ALEMBIC_REVISION="expected-version")):
            response = await health.readiness()
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
