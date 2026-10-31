"""Database session management."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Generator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.db.engine import (
    AsyncSessionLocal,
    AsyncSessionLocal as AsyncSessionLocal_,
    SessionLocal,
    get_async_session as get_async_session_,
    get_session as get_session_,
    get_async_session_dependency,
)

# Re-export for convenience
get_session = get_session_
get_async_session = get_async_session_

# Re-export session factories
SessionLocal_ = SessionLocal
AsyncSessionLocal_ = AsyncSessionLocal

__all__ = [
    "SessionLocal",
    "AsyncSessionLocal",
    "get_session",
    "get_async_session",
    "get_async_session_dependency",
]