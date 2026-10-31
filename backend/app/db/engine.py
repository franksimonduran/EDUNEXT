"""Database engine configuration for SQLAlchemy 2.x async."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db.connection_options import database_connection


SYNC_DATABASE_URL, _sync_connect_args = database_connection(settings, asynchronous=False)
ASYNC_DATABASE_URL, _async_connect_args = database_connection(settings, asynchronous=True)

if settings.APP_ENV == "test":
    _pool_options = {"poolclass": NullPool}
else:
    _pool_options = {
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 3600,
    }

# Synchronous engine for Alembic migrations and sync operations
engine = create_engine(
    SYNC_DATABASE_URL,
    echo=False,  # SQL parameters can contain credentials and private academic data.
    connect_args=_sync_connect_args,
    **_pool_options,
)

# Asynchronous engine for FastAPI async operations
async_engine: AsyncEngine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    connect_args=_async_connect_args,
    **_pool_options,
)

# Session factories
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_session() -> Generator[Session, None, None]:
    """Get synchronous database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get asynchronous database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_async_session_dependency() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    from app.db.base import Base
    
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await async_engine.dispose()
    engine.dispose()
