"""Local startup/capability checks; never sends educational text to a provider."""

import asyncio
from httpx import ASGITransport, AsyncClient
from app.main import create_app
from app.providers.provider_registry import configured_provider
from app.repositories.dictionary_repository import entries


async def verify():
    app=create_app()
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app),base_url="http://test") as client:
            live=await client.get("/api/v1/health/live")
            denied=await client.get("/api/v1/ai/capabilities")
            assert live.status_code==200 and denied.status_code==401
            print(f"AI_RUNTIME liveness={live.status_code} unauthenticated_capabilities={denied.status_code}")
    print(f"AI_DICTIONARY project_entries={len(entries())}")
    provider=configured_provider()
    print("AI_PROVIDER", "not_configured_or_disabled" if provider is None else "model_available" if await provider.available() else "model_unavailable")
    print("AI_LIVE_GENERATION not_executed")


if __name__=="__main__":
    asyncio.run(verify())
