"""Explicit expiration only for AI technical metadata; never academic records."""

from datetime import datetime, timezone
import asyncio
import logging
from sqlalchemy import delete
from app.db.models.ai import AIUsageEvent, PronunciationSession


async def purge_expired_ai_metadata(session, *, now=None):
    cutoff = now or datetime.now(timezone.utc)
    usage = await session.execute(delete(AIUsageEvent).where(AIUsageEvent.expires_at <= cutoff))
    practice = await session.execute(delete(PronunciationSession).where(PronunciationSession.expires_at <= cutoff))
    return {"expired_usage_events": usage.rowcount, "expired_reference_sessions": practice.rowcount}


async def ai_retention_worker():
    from app.core.config import settings
    from app.db.engine import AsyncSessionLocal
    while True:
        try:
            async with AsyncSessionLocal() as session:
                await purge_expired_ai_metadata(session)
                await session.commit()
        except asyncio.CancelledError:
            raise
        except Exception:
            # No SQL bodies, prompts, audio, tokens or private exception details in logs.
            logging.getLogger(__name__).warning("AI retention sweep unavailable")
        await asyncio.sleep(settings.AI_RETENTION_SWEEP_SECONDS)
