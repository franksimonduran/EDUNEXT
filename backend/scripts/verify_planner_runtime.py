"""Run the configured application lifespan and verify liveness/authentication boundary.

Run from backend: python -m scripts.verify_planner_runtime
Uses normal startup role/grade seeding, without creating student data.
"""

import asyncio

from httpx import ASGITransport, AsyncClient

from app.main import create_app


async def verify():
    app = create_app()
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            live = await client.get("/api/v1/health/live")
            denied = await client.get("/api/v1/assignments/me")
            print(f"LIFESPAN liveness={live.status_code} unauthenticated_planner={denied.status_code}")
            assert live.status_code == 200 and denied.status_code == 401


if __name__ == "__main__":
    asyncio.run(verify())
