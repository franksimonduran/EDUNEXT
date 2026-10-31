"""Own isolated cwd and synthetic tests only. Never loads destructive conftest."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
TEMP = Path(r"C:\Users\simon\AppData\Local\Temp\opencode")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", type=Path, required=True)
    args = parser.parse_args()
    destination = os.environ.get("AITHRON_FINAL_EVIDENCE_DIR", "")
    if os.environ.get("AITHRON_FINAL_VALIDATION") != "1" or not re.fullmatch(r"docs/final/evidence/argos-translation-[A-Za-z0-9_-]+", destination):
        parser.error("Explicit new final evidence directory required")
    models = args.models.resolve()
    env = {**os.environ, "APP_ENV": "test", "APP_NAME": "EDUNEXT Backend", "DEBUG": "true",
        "DATABASE_URL": "postgresql+asyncpg://synthetic:synthetic@127.0.0.1:1/argos_unused", "TEST_DATABASE_URL": "",
        "DATABASE_SSL_MODE": "disable", "DATABASE_SSL_CA_FILE": "", "TRUSTED_HOSTS": "localhost,127.0.0.1",
        "CORS_ORIGINS": "http://127.0.0.1:8080", "SECRET_KEY": "synthetic-argos-test-only-signing-key",
        "CSRF_SECRET_KEY": "synthetic-argos-test-only-csrf-key", "AITHRON_AI_ENABLED": "false",
        "AI_LOCAL_ONLY_ATTESTED": "false", "SYNC_ENABLED": "false", "SYNC_PROTOCOL_V1_ENABLED": "false",
        "PYTHONPATH": str(ROOT / "backend"), "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1",
        "EDUNEXT_ARGOS_TEST_PACKAGES": str(models), "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}
    results = []
    with tempfile.TemporaryDirectory(prefix="edunext-argos-checks-", dir=TEMP) as scratch:
        pytest = [sys.executable, "-X", "utf8", "-m", "pytest", "-q", "-p", "pytest_asyncio.plugin",
            "-o", "asyncio_mode=auto", "-o", "asyncio_default_fixture_loop_scope=function", "--confcutdir=" + str(ROOT / "backend/verification")]
        jobs = [
            ("argos-adapter-and-real-models", [*pytest, str(ROOT / "backend/verification/test_argos_provider.py")]),
            ("existing-ai-pure-contracts", [*pytest, str(ROOT / "backend/verification/test_ai_engine.py"), "-k", "reject_private or reject_unsafe or dictionary_reuses or ollama_http or failures_are_bounded"]),
        ]
        for name, command in jobs:
            run = subprocess.run(command, cwd=scratch, env=env, capture_output=True, text=True, encoding="utf-8", timeout=120)
            results.append({"name": name, "pass": run.returncode == 0, "exitCode": run.returncode, "stdout": run.stdout[-25000:], "stderr": run.stderr[-4000:]})
        samples = [("en", "es", "Hello world!", "hola"), ("es", "en", "El agua es importante.", "water")]
        for source, target, text, expected in samples:
            run = subprocess.run([sys.executable, "-X", "utf8", str(ROOT / "backend/scripts/translate_local.py"), "--packages-dir", str(models), "--from", source, "--to", target], input=text, cwd=scratch, env=env, capture_output=True, text=True, encoding="utf-8", timeout=90)
            results.append({"name": "real-terminal-" + source + "-" + target, "pass": run.returncode == 0 and expected in run.stdout.casefold(), "input": text, "output": run.stdout.strip(), "stderr": run.stderr[-1000:]})
        wrapper = str(ROOT / "tools/translate-local.ps1").replace("'", "''")
        python = sys.executable.replace("'", "''")
        run = subprocess.run(["powershell", "-NoProfile", "-Command", f"$input | & '{wrapper}' -Python '{python}' -From en -To es"], input="Hello world!\n", cwd=scratch, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
        results.append({"name": "powershell-launcher-pipeline", "pass": run.returncode == 0 and "hola mundo" in run.stdout.casefold(), "stdout": run.stdout[-1000:], "stderr": run.stderr[-1000:]})
        check = subprocess.run([sys.executable, "-m", "pip", "check"], cwd=scratch, env=env, capture_output=True, text=True, encoding="utf-8", timeout=30)
        results.append({"name": "installed-dependency-consistency-not-security-audit", "pass": check.returncode == 0, "stdout": check.stdout[-3000:], "stderr": check.stderr[-1000:]})
    paths = ["backend/app/providers/argos_provider.py", "backend/app/providers/argos_worker.py", "backend/app/providers/provider_registry.py", "backend/app/core/config.py", "backend/app/services/ai_gateway_service.py", "backend/app/api/v1/endpoints/assessments.py", "backend/app/services/assessment_service.py", "backend/scripts/install_argos_models.py", "backend/scripts/translate_local.py", "frontend/js/student/translator.js", "backend/verification/test_argos_provider.py", "backend/verification/test_ai_engine.py", "backend/verification/argos_browser_fixture.py", "tests/fixtures/argos-translation-browser.cjs", "tests/frontend-refresh.browser.cjs", "tools/translate-local.ps1", "docs/ARGOS_TRANSLATE_SETUP.md", "README.md", "backend/pyproject.toml", "backend/.env.example", ".gitignore", "tools/final-inventory.cjs", "tools/validate-argos.py"]
    receipt = json.loads((models / "model-set.json").read_text(encoding="utf-8"))
    result = {"date": datetime.now(timezone.utc).isoformat(), "scope": "Real CPU translation with socket-denied isolated workers and synthetic text; gateway policy/session/database doubles. NOT PostgreSQL authentication, institutional approval, Android-native translation or pedagogical certification.", "results": results, "model_packages": receipt,
        "hashes": [{"file": file, "sha256": hashlib.sha256((ROOT / file).read_bytes()).hexdigest()} for file in paths], "pass": all(result["pass"] for result in results), "decision": "NO-GO"}
    output = ROOT / destination
    output.mkdir(parents=True, exist_ok=True)
    with (output / "ARGOS_TRANSLATION_VALIDATION.json").open("x", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)
    print(json.dumps({"pass": result["pass"], "results": results, "evidence": destination}, ensure_ascii=True, indent=2))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
