"""Common dependencies for FastAPI endpoints."""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings


async def get_request_id(x_request_id: str | None = Header(default=None)) -> str:
    """Extract or generate request ID from headers."""
    return x_request_id or ""


def get_current_settings() -> "Settings":
    """Get current application settings."""
    from app.core.config import settings
    return settings


async def verify_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None
) -> None:
    """Verify API key if configured (placeholder for future implementation)."""
    # In the future, this will validate API keys
    # For now, it's a no-op since we don't have authentication implemented
    if settings.APP_ENV == "production":
        if not x_api_key:
            raise HTTPException(
                status_code=401,
                detail="API key required",
            )
        # TODO: Validate API key against database
    return None