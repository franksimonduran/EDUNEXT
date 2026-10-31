"""Logging configuration for the application."""

import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings


class SafeJSONFormatter(logging.Formatter):
    """Allowlisted technical fields only; never serialize exception text or locals."""
    def format(self, record):
        events = {"Request started": "request_started", "Request completed": "request_completed",
                  "Request failed": "request_failed", "AI retention sweep unavailable": "ai_retention_unavailable"}
        result = {"timestamp": datetime.now(timezone.utc).isoformat(), "level": record.levelname,
                  "service": "aithron-api", "environment": settings.APP_ENV,
                  "event": events.get(str(record.msg), "application_event")}
        for key in ("request_id", "method", "route_template", "status_code", "duration_ms", "error_type"):
            value = getattr(record, key, None)
            if isinstance(value, (str, int, float)):
                result[key] = value[:200] if isinstance(value, str) else value
        if record.exc_info and record.exc_info[0] is not None:
            result["error_type"] = record.exc_info[0].__name__
        return json.dumps(result, ensure_ascii=False)


def setup_logging() -> None:
    """Configure application logging."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Configure root logger
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(SafeJSONFormatter())
    logging.basicConfig(level=log_level, handlers=[handler], force=True)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(name).handlers.clear()
        logging.getLogger(name).propagate = True

    # Set specific loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for the given module name."""
    return logging.getLogger(name)


class RequestLogger:
    """Context manager for request-scoped logging."""

    def __init__(self, request_id: str, path: str, method: str):
        self.request_id = request_id
        self.path = path
        self.method = method
        self.logger = logging.getLogger("request")

    def __enter__(self) -> "RequestLogger":
        self.logger.info(
            "Request started",
            extra={
                "request_id": self.request_id,
                "method": self.method,
                "path": self.path,
            },
        )
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_type:
            self.logger.error(
                "Request failed",
                extra={
                    "request_id": self.request_id,
                    "method": self.method,
                    "path": self.path,
                    "error_type": exc_type.__name__,
                },
            )
        else:
            self.logger.info(
                "Request completed",
                extra={
                    "request_id": self.request_id,
                    "method": self.method,
                    "path": self.path,
                },
            )
