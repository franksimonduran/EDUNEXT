"""Explicit operator command: python -m scripts.purge_expired_ai_metadata.

Only removes expired AI technical metadata. A periodic application worker also
performs this sweep; this command is an explicit operator supplement.
"""
import asyncio
from app.db.engine import AsyncSessionLocal
from app.services.ai_retention_service import purge_expired_ai_metadata


async def main():
    async with AsyncSessionLocal() as session:
        result = await purge_expired_ai_metadata(session)
        await session.commit()
        print(result)


if __name__ == "__main__":
    asyncio.run(main())
