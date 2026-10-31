"""TEST ONLY: loopback ephemeral HTTP fixture, real model and synthetic policy/DB.

Not an alternate application, account, deployment or authentication implementation.
The test runner stops it. Never use with student text or expose beyond loopback.
"""

import argparse
import asyncio
import os
from pathlib import Path
import socket
import tempfile


def main():
    if os.environ.get("AITHRON_FINAL_VALIDATION") != "1" or os.environ.get("EDUNEXT_ARGOS_BROWSER_FIXTURE") != "1":
        raise SystemExit("Only the explicit synthetic browser test may start this fixture")
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", type=Path, required=True)
    args = parser.parse_args()
    models = args.models.resolve()
    temp_root = Path(r"C:\Users\simon\AppData\Local\Temp\opencode")
    with tempfile.TemporaryDirectory(prefix="argos-browser-fixture-", dir=temp_root) as scratch:
        os.chdir(scratch)
        os.environ.update({"APP_ENV": "test", "DEBUG": "true", "DATABASE_URL": "postgresql+asyncpg://synthetic:synthetic@127.0.0.1:1/argos_unused", "TEST_DATABASE_URL": "", "DATABASE_SSL_MODE": "disable", "DATABASE_SSL_CA_FILE": "", "SECRET_KEY": "synthetic-fixture-only-signing-key", "CSRF_SECRET_KEY": "synthetic-fixture-only-csrf-key", "AITHRON_AI_ENABLED": "true", "AI_LOCAL_ONLY_ATTESTED": "true", "AI_PROVIDER_CODE": "argos_local", "AI_ARGOS_PACKAGES_DIR": str(models), "AI_TIMEOUT_SECONDS": "60", "SYNC_ENABLED": "false", "SYNC_PROTOCOL_V1_ENABLED": "false", "CORS_ORIGINS": "http://127.0.0.1:8080"})
        try:
            import json
            from types import SimpleNamespace
            from unittest.mock import AsyncMock
            from uuid import uuid4
            import uvicorn
            from fastapi import FastAPI
            from fastapi.responses import JSONResponse
            from app.api.v1.endpoints import ai
            from app.core.exceptions import AithronException, ConflictError
            from app.dependencies.auth import get_authorization_context
            from app.services.ai_gateway_service import AIGatewayService

            context = SimpleNamespace(user_id=uuid4(), institution_id=uuid4(), permissions=["ai.translate.use_own", "ai.tutor.use_own", "ai.dictionary.read"])
            policy = SimpleNamespace(tutor_enabled=True, translation_enabled=True, provider_approved=True, dictionary_enabled=True, max_input_characters=1000, max_output_tokens=512)
            seen = set()
            async def reserve(context, operation_id, *args):
                if operation_id in seen:
                    raise ConflictError("Synthetic duplicate operation")
                seen.add(operation_id)
                return SimpleNamespace(), policy
            def service(session):
                instance = AIGatewayService(session)
                instance.identity = AsyncMock(return_value=SimpleNamespace(timezone="UTC"))
                instance.repo.policy = AsyncMock(return_value=policy)
                instance.repo.reserve = reserve
                return instance
            ai.AIGatewayService = service  # Test double; never changed in product source.
            session = SimpleNamespace(execute=AsyncMock(return_value=SimpleNamespace(first=lambda: None)), commit=AsyncMock(), rollback=AsyncMock())
            async def database():
                yield session
            app = FastAPI()
            app.include_router(ai.router, prefix="/api/v1")
            app.dependency_overrides[get_authorization_context] = lambda: context
            app.dependency_overrides[ai.ai_database] = database
            @app.exception_handler(AithronException)
            async def failure(request, error):
                return JSONResponse(status_code=error.status_code, content={"detail": {"message": error.message, "code": error.code}}, headers={"Cache-Control": "private, no-store"})
            @app.get("/fixture-health")
            async def ready():
                return {"scope": "TEST_ONLY_SYNTHETIC_POLICY_REAL_ARGOS_NO_DATABASE"}
            with socket.socket() as listener:
                listener.bind(("127.0.0.1", 0))
                listener.listen(128)
                print(json.dumps({"port": listener.getsockname()[1]}), flush=True)
                server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", access_log=False, log_level="critical"))
                asyncio.run(server.serve(sockets=[listener]))
        finally:
            os.chdir(temp_root)


if __name__ == "__main__":
    main()
