"""Main FastAPI application entry point."""

from contextlib import asynccontextmanager, suppress
import asyncio
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AithronException
from app.core.logging import setup_logging
from app.core.middleware import add_middleware
from app.db.engine import AsyncSessionLocal, close_db
from app.services.academic_seed import ensure_default_grades
from app.services.role_seed import ensure_system_roles


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    setup_logging()
    retention = None
    try:
        async with AsyncSessionLocal() as session:
            await ensure_system_roles(session)
            await ensure_default_grades(session)
            await session.commit()
        from app.services.ai_retention_service import ai_retention_worker
        retention = asyncio.create_task(ai_retention_worker())
        yield
    finally:
        if retention is not None:
            retention.cancel()
            with suppress(asyncio.CancelledError):
                await retention
        await close_db()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="EDUNEXT Backend API - Educational platform backend",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if settings.DEBUG else None,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # Configure CORS
    from app.core.ai_middleware import AIBodyLimitMiddleware
    app.add_middleware(AIBodyLimitMiddleware, prefix=settings.API_V1_PREFIX+"/ai")
    app.add_middleware(AIBodyLimitMiddleware, prefix=settings.API_V1_PREFIX+"/sync", max_bytes=16384,
                       detail="La solicitud Sync excede el límite de transporte", code="SYNC_BODY_LIMIT")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "Retry-After"],
    )

    # Add custom middlewares
    from app.core.middleware import add_middleware
    add_middleware(app)
    hosts = [host.strip() for host in settings.TRUSTED_HOSTS.split(",") if host.strip()]
    if settings.APP_ENV == "test":
        hosts.extend(["test", "testserver"])
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)

    @app.exception_handler(AithronException)
    async def aithron_exception_handler(request: Request, exc: AithronException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


# Create the app instance
app = create_app()
