"""Verify normal application startup, report auth boundary and transaction policy."""

import asyncio

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.api.v1.endpoints.reports import report_database
from app.main import create_app


async def verify():
    app = create_app()
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            live = await client.get("/api/v1/health/live")
            denied = await client.get("/api/v1/reports/catalog")
            assert live.status_code == 200 and denied.status_code == 401
            print(f"REPORT_RUNTIME liveness={live.status_code} unauthenticated_catalog={denied.status_code}")
        async for session in report_database():
            isolation = (await session.execute(text("SHOW transaction_isolation"))).scalar_one()
            timeout = (await session.execute(text("SHOW statement_timeout"))).scalar_one()
            assert isolation == "repeatable read" and timeout == "10s"
            print(f"REPORT_TRANSACTION isolation={isolation} statement_timeout={timeout}")
        params = app.openapi()["paths"]["/api/v1/reports/{scope}/{kind}"]["get"]["parameters"]
        assert "cutoff" in {p["name"] for p in params}
        print("REPORT_OPENAPI filters=present")


if __name__ == "__main__":
    asyncio.run(verify())
