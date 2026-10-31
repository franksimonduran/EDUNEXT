"""Isolated brand/API smoke; never imports backend/tests/conftest or opens a DB."""
import ast
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import traceback

ROOT = Path(__file__).resolve().parents[1]
TEMP = Path(r"C:\Users\simon\AppData\Local\Temp\opencode")
destination = os.environ.get("AITHRON_FINAL_EVIDENCE_DIR", "")
if os.environ.get("AITHRON_FINAL_VALIDATION") != "1" or not destination.startswith("docs/final/evidence/edunext-brand-backend-") or ".." in destination:
    raise SystemExit("Explicit new final evidence directory required")
output = ROOT / destination
output.mkdir(parents=True, exist_ok=True)
result = {"scope": "Isolated app construction, OpenAPI and ASGI without lifespan/DB. Not full startup, authenticated PostgreSQL E2E or production readiness.", "checks": [], "decision": "NO-GO"}

with tempfile.TemporaryDirectory(prefix="edunext-brand-", dir=TEMP) as scratch:
    os.chdir(scratch)  # Settings' relative .env cannot read the project's private file.
    os.environ.update({"APP_ENV": "test", "APP_NAME": "EDUNEXT Backend", "DEBUG": "true", "DATABASE_URL": "postgresql+asyncpg://synthetic:synthetic@127.0.0.1:1/edunext_brand_unused", "DATABASE_SSL_MODE": "disable", "DATABASE_SSL_CA_FILE": "", "TEST_DATABASE_URL": "", "SECRET_KEY": "synthetic-brand-only-signing-not-for-use", "CSRF_SECRET_KEY": "synthetic-brand-only-csrf-not-for-use", "TRUSTED_HOSTS": "localhost,127.0.0.1", "CORS_ORIGINS": "http://127.0.0.1:8080", "AITHRON_AI_ENABLED": "false", "AI_LOCAL_ONLY_ATTESTED": "false", "SYNC_ENABLED": "false", "SYNC_PROTOCOL_V1_ENABLED": "false", "PYTHONPATH": str(ROOT / "backend"), "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1"})
    sys.path.insert(0, str(ROOT / "backend"))
    try:
        for file in (ROOT / "backend").rglob("*.py"):
            if not any(part in {".venv", "venv", "__pycache__"} for part in file.parts):
                ast.parse(file.read_text(encoding="utf-8-sig"), filename=str(file.relative_to(ROOT)))
        result["checks"].append({"name": "Python AST syntax", "pass": True})
        from unittest.mock import AsyncMock, patch
        from sqlalchemy.engine import Engine
        from sqlalchemy.ext.asyncio import AsyncSession
        from fastapi.testclient import TestClient
        with patch.object(Engine, "connect", side_effect=AssertionError("Unexpected database connection")), patch.object(AsyncSession, "execute", new=AsyncMock(side_effect=AssertionError("Unexpected SQL"))):
            from app.main import create_app
            from app.core.config import Settings, settings
            assert Settings(_env_file=None).APP_NAME == "EDUNEXT Backend"
            assert settings.JWT_ISSUER == "aithron-edu"
            assert settings.JWT_AUDIENCE == "aithron-edu-web"
            app = create_app()
            schema = app.openapi()
            assert schema["info"]["title"] == "EDUNEXT Backend"
            assert "EDUNEXT" in schema["info"]["description"]
            assert "/api/v1/ai/tutor/messages" in schema["paths"]
            assert "/api/v1/sync/operations" in schema["paths"]
            client = TestClient(app, base_url="http://localhost")
            assert client.get("/api/v1/health/live").status_code == 200
            for route in ["/ai/capabilities", "/sync/status", "/reports/catalog", "/insights/rules/catalog"]:
                assert client.get("/api/v1" + route).status_code == 401
            result["checks"].append({"name": "EDUNEXT OpenAPI, preserved JWT defaults, liveness and unauthenticated boundaries", "pass": True, "paths": len(schema["paths"]), "lifespan": "Not entered: startup seeds require an authorized database"})
        run = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "pytest_asyncio.plugin", "--confcutdir=" + str(ROOT / "backend/verification"), str(ROOT / "backend/verification/test_phase47_boundaries.py")], cwd=scratch, capture_output=True, text=True, timeout=90)
        result["checks"].append({"name": "Existing isolated ASGI verification (no backend/tests conftest)", "pass": run.returncode == 0, "exitCode": run.returncode, "stdout": run.stdout[-14000:], "stderr": run.stderr[-3000:]})
    except Exception as error:
        result["checks"].append({"name": "Backend verification", "pass": False, "errorClass": type(error).__name__, "module": getattr(error, "name", None), "frames": [{"file": Path(frame.filename).name, "line": frame.lineno, "function": frame.name} for frame in traceback.extract_tb(error.__traceback__)[-8:]]})
    finally:
        os.chdir(TEMP)  # Windows cannot remove the current working directory.
result["pass"] = bool(result["checks"]) and all(check["pass"] for check in result["checks"])
with (output / "EDUNEXT_BACKEND_VALIDATION.json").open("x", encoding="utf-8") as file:
    json.dump(result, file, indent=2, ensure_ascii=False)
print(json.dumps(result, indent=2, ensure_ascii=True))
raise SystemExit(0 if result["pass"] else 1)
