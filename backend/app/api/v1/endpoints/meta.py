"""Metadata endpoints."""

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/meta", summary="API metadata")
async def meta() -> dict:
    """Return API metadata.

    Returns:
        dict: Public metadata about the API.
    """
    return {
        "name": "EDUNEXT Backend",
        "version": settings.APP_VERSION,
        "description": "Backend API for EDUNEXT educational platform",
        "api_version": "v1",
        "docs_url": "/docs" if settings.DEBUG else None,
    }


@router.get("/meta/version", summary="API version")
async def version() -> dict:
    """Return API version information.

    Returns:
        dict: Version information.
    """
    return {"version": settings.APP_VERSION, "api_version": "v1"}
