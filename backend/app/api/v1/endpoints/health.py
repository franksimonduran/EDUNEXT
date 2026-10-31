"""Health check endpoints."""

import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.db.engine import async_engine

router = APIRouter()


@router.get("/health/live", summary="Liveness probe")
async def liveness() -> dict:
    """Liveness probe endpoint.

    Returns:
        dict: Simple status indicating the service is running.
    """
    return {"status": "alive", "service": "athron-edu-backend"}


@router.get("/health/ready", summary="Readiness probe")
async def readiness():
    """Readiness probe endpoint.

    Returns:
        dict: Status indicating if the service is ready to accept traffic.
    """
    try:
        async with asyncio.timeout(settings.HEALTHCHECK_TIMEOUT_SECONDS):
            async with async_engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
                if settings.EXPECTED_ALEMBIC_REVISION:
                    versions = (await connection.execute(text("SELECT version_num FROM alembic_version"))).scalars().all()
                    if set(versions) != {settings.EXPECTED_ALEMBIC_REVISION}:
                        return JSONResponse({"status": "not_ready"}, status_code=503)
    except Exception:
        # No hostnames, schema names, versions, SQL, credentials or exception details.
        return JSONResponse({"status": "not_ready"}, status_code=503)
    return {"status": "ready"}
