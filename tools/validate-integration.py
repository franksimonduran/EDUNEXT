"""Isolated, non-DB integration verification. Keeps historical evidence immutable."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--temp-dir", required=True, type=Path)
    parser.add_argument("--browser", action="store_true", help="Run existing public/demo browser checks, not authenticated E2E")
    parser.add_argument("--evidence-name", help="New unique phase47-integration-* namespace; an existing directory is never reused")
    args = parser.parse_args()
    if os.environ.get("AITHRON_FINAL_VALIDATION") != "1":
        raise SystemExit("AITHRON_FINAL_VALIDATION=1 is required")
    root = Path(__file__).resolve().parents[1]
    work = Path(tempfile.mkdtemp(prefix="phase47-isolated-", dir=args.temp_dir))
    name = args.evidence_name or "phase47-integration-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    if not re.fullmatch(r"phase47-integration-[A-Za-z0-9_-]+", name):
        raise SystemExit("Invalid evidence namespace")
    output = root / "docs" / "final" / "evidence" / name
    output.mkdir(exist_ok=False)
    # Deliberately do not inherit application credentials, provider settings or DB URLs.
    allowed = ("PATH", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA")
    env = {key: os.environ[key] for key in allowed if key in os.environ}
    env.update(APP_ENV="test", DEBUG="false", PYTHONUTF8="1",
               DATABASE_URL="postgresql://synthetic:synthetic@127.0.0.1:1/aithron_isolated_unreachable",
               TEST_DATABASE_URL="postgresql://synthetic:synthetic@127.0.0.1:1/aithron_isolated_unreachable",
               SECRET_KEY="phase47-synthetic-only-not-for-deployment", CSRF_SECRET_KEY="phase47-synthetic-csrf-only",
               AITHRON_ASSESSMENT_READONLY_DB="0", AITHRON_AI_ENABLED="false", SYNC_ENABLED="false",
               SYNC_PROTOCOL_V1_ENABLED="false", AITHRON_FINAL_VALIDATION="1",
               AITHRON_FINAL_EVIDENCE_DIR="docs/final/evidence/" + name)
    backend = str(root / "backend")
    setup = "import sys; sys.path.insert(0," + repr(backend) + "); "
    results = []

    def run(label, command, *, cwd=work, timeout=120):
        completed = subprocess.run(command, cwd=cwd, env=env, capture_output=True,
                                   text=True, encoding="utf-8", errors="replace", timeout=timeout)
        results.append({"check": label, "exit_code": completed.returncode,
                        "output": completed.stdout + completed.stderr})
        print(label, completed.returncode)

    tests = ["test_assessment_foundations.py", "test_sync_contract.py", "test_insight_rules.py",
             "test_phase48_security.py", "test_phase47_boundaries.py"]
    testargs = [str(root / "backend" / "verification" / test) for test in tests]
    testargs += ["--confcutdir=" + str(root / "backend" / "verification"), "-q", "-p", "no:cacheprovider"]
    run("python_non_database_contracts", [sys.executable, "-c", setup + "import pytest; raise SystemExit(pytest.main(" + repr(testargs) + "))"])
    run("resolved_dependencies", [sys.executable, "-m", "pip", "list", "--format=json", "--disable-pip-version-check"])
    for test in ("phase47-api.cjs", "phase48-session.cjs", "phase48-security.cjs", "sync-protocol.cjs", "phase47-private-views.cjs"):
        run(test, ["node", "--experimental-vm-modules", str(root / "tests" / test)], cwd=root)
    run("source_inventory", ["node", str(root / "tools" / "audit-phase47.cjs")], cwd=root)
    runtime = """
import json
from pathlib import Path
from app.main import create_app
from app.db.base import Base
from alembic.config import Config
from alembic.script import ScriptDirectory
app = create_app()
schema = app.openapi()
config = Config()
config.set_main_option('script_location', SCRIPT_LOCATION)
scripts = ScriptDirectory.from_config(config)
artifact = {
 'scope': 'Runtime OpenAPI and ORM/source metadata, not a connected DB schema',
 'openapi': schema,
 'tables': {name: {'columns': {c.name: str(c.type) for c in table.columns},
                   'foreign_keys': [str(f.target_fullname) for f in table.foreign_keys]}
            for name, table in Base.metadata.tables.items()},
 'migration_heads': scripts.get_heads(),
 'migration_graph': [{'revision': r.revision, 'parent': r.down_revision} for r in scripts.walk_revisions()],
}
Path(ARTIFACT).write_text(json.dumps(artifact, indent=2), encoding='utf-8')
print(json.dumps({'openapi_paths': len(schema['paths']), 'orm_tables': len(Base.metadata.tables), 'source_migration_heads': scripts.get_heads()}))
"""
    run("runtime_inventory", [sys.executable, "-c", setup + "SCRIPT_LOCATION=" + repr(str(root / "backend" / "alembic")) + "; ARTIFACT=" + repr(str(output / "RUNTIME_INVENTORY.json")) + ";\n" + runtime])
    files = ["backend/pyproject.toml", "backend/app/api/v1/endpoints/educational_resources.py",
             "backend/verification/test_phase47_boundaries.py", "frontend/js/services/auth.service.js",
             "frontend/js/services/insights-api.service.js", "frontend/js/components/insights-api-view.js",
             "frontend/js/components/reports-api-view.js", "frontend/js/student/progress.js",
             "frontend/js/student/synchronization.js", "tests/phase47-private-views.cjs",
             "tools/audit-phase47.cjs", "tools/validate-integration.py", "README.md",
             "docs/INTEGRATION_MODULE_INVENTORY.md", "docs/FULL_INTEGRATION_ARCHITECTURE.md",
             "docs/FRONTEND_BACKEND_CONTRACTS.md", "docs/INTEGRATION_ENVIRONMENT.md",
             "docs/INTEGRATION_KNOWN_LIMITATIONS.md", "docs/INTEGRATION_SECURITY_FINDINGS.md",
             "docs/AI_INTEGRATION_STATUS.md", "docs/SYNC_INTEGRATION_STATUS.md",
             "docs/INTEGRATION_TEST_RESULTS.md", "docs/PHASE_47_CONTINUATION_2026-10-27.md"]
    for file in files:
        if file.endswith((".js", ".cjs")):
            source = (root / file).read_text(encoding="utf-8-sig")
            check = subprocess.run(["node", "--input-type=module", "--check"], input=source, env=env,
                                   capture_output=True, text=True, encoding="utf-8", timeout=30)
            results.append({"check": "syntax:" + file, "exit_code": check.returncode, "output": check.stdout + check.stderr})
    if args.browser:
        run("public_demo_browser_regression", ["node", str(root / "tests" / "phase48-browser.cjs")], cwd=root, timeout=300)
    evidence = {"generated_at": datetime.now(timezone.utc).isoformat(), "AITHRON_FINAL_VALIDATION": 1,
                "environment": "Disposable Python environment; isolated CWD without .env; synthetic disabled-service configuration",
                "scope": "Contracts, ASGI with synthetic auth/storage, OpenAPI, source, JS doubles; no PostgreSQL or real provider E2E",
                "results": results,
                "hashes": [{"path": file, "sha256": hashlib.sha256((root / file).read_bytes()).hexdigest()} for file in files]}
    (output / "RESULTS.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output.relative_to(root))
    return 0 if all(result["exit_code"] == 0 for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
