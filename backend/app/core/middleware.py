"""Middleware for the FastAPI application."""

import time
import uuid
import re
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging import get_logger

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to each request."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate or extract request ID
        candidate = request.headers.get("X-Request-ID", "")
        request_id = candidate if re.fullmatch(r"[A-Za-z0-9_-]{1,64}", candidate) else str(uuid.uuid4())
        request.state.request_id = request_id

        # Add request ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        # API responses may contain credentials, private answers or student records.
        response.headers["Cache-Control"] = "no-store"

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log request and response details."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()

        # Log request
        logger.info(
            "Request started",
            extra={
                "method": request.method,
                "path": request.url.path,
            },
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(
                "Request failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": type(exc).__name__,
                    "request_id": getattr(request.state, "request_id", None),
                    "route_template": getattr(request.scope.get("route"), "path", "unmatched"),
                },
            )
            raise

        # Log response
        logger.info(
            "Request completed",
            extra={
                "method": request.method,
                "request_id": getattr(request.state, "request_id", None),
                "route_template": getattr(request.scope.get("route"), "path", "unmatched"),
                "status_code": response.status_code,
                "duration_ms": round((time.perf_counter() - start_time) * 1000, 2),
            },
        )

        return response


def add_middleware(app):
    """Add all middlewares to the application."""
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RequestIDMiddleware)
