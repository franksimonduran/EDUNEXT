"""Shared, explicit database TLS policy for API and Alembic. Never log URLs."""
import ssl
from sqlalchemy.engine import make_url


def database_connection(settings, *, asynchronous):
    url = make_url(settings.DATABASE_URL or "postgresql+asyncpg://postgres:postgres@localhost:5432/athron_edu")
    url = url.set(drivername="postgresql+asyncpg" if asynchronous else "postgresql+psycopg2")
    if asynchronous:
        options = {"timeout": settings.DATABASE_CONNECT_TIMEOUT_SECONDS,
                   "command_timeout": settings.DATABASE_COMMAND_TIMEOUT_SECONDS}
        options["ssl"] = ssl.create_default_context(cafile=settings.DATABASE_SSL_CA_FILE) if settings.DATABASE_SSL_MODE == "verify-full" else False
    else:
        options = {"connect_timeout": settings.DATABASE_CONNECT_TIMEOUT_SECONDS,
                   "options": f"-c statement_timeout={settings.DATABASE_COMMAND_TIMEOUT_SECONDS * 1000}",
                   "sslmode": settings.DATABASE_SSL_MODE}
        if settings.DATABASE_SSL_MODE == "verify-full":
            options["sslrootcert"] = settings.DATABASE_SSL_CA_FILE
    return url, options
