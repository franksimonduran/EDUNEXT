"""System status endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency

router = APIRouter()


@router.get("/system/status", summary="System status")
async def system_status(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> dict:
    """Get the current status of all system components."""
    try:
        await session.execute(text("SELECT 1"))
        database_status = "available"
    except SQLAlchemyError:
        database_status = "unavailable"

    return {
        "api": "available",
        "database": database_status,
        "athron_ai": "not_integrated",
        "sync": "not_integrated",
        "auth": "available",
    }