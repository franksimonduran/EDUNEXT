"""Bounded local audit evidence. No DB/provider/production traffic or private .env."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=("baseline", "after"), required=True)
    parser.add_argument("--temp-dir", type=Path, required=True)
    parser.add_argument("--full-regression", action="store_true")
    args = parser.parse_args()
    if os.environ.get("AITHRON_FINAL_VALIDATION") != "1":
        raise SystemExit("AITHRON_FINAL_VALIDATION=1 required")
    root = Path(__file__).resolve().parents[1]
    work = Path(tempfile.mkdtemp(prefix="phase48-isolated-", dir=args.temp_dir))
    output = root / "docs/final/evidence" / ("phase48-" + args.stage + "-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))
    output.mkdir(exist_ok=False)
    allowed = ("PATH", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA")
    env = {key: os.environ[key] for key in allowed if key in os.environ}
    env.update(APP_ENV="test", DEBUG="false", PYTHONUTF8="1",
               DATABASE_URL="postgresql://synthetic:synthetic@127.0.0.1:1/aithron_isolated_unreachable",
               TEST_DATABASE_URL="postgresql://synthetic:synthetic@127.0.0.1:1/aithron_isolated_unreachable",
               SECRET_KEY="phase48-synthetic-not-for-deployment", CSRF_SECRET_KEY="phase48-synthetic-csrf",
               AITHRON_ASSESSMENT_READONLY_DB="0", AITHRON_AI_ENABLED="false", SYNC_ENABLED="false",
               SYNC_PROTOCOL_V1_ENABLED="false", AITHRON_FINAL_VALIDATION="1")
    setup = "import sys; sys.path.insert(0," + repr(str(root / "backend")) + "); "
    results = []

    def run(label, command, *, cwd=work, timeout=120):
        process = subprocess.run(command, env=env, cwd=cwd, capture_output=True, text=True,
                                 encoding="utf-8", errors="replace", timeout=timeout)
        results.append({"check": label, "exit_code": process.returncode, "output": process.stdout + process.stderr})
        print(label, process.returncode)

    files = ["backend/app/dependencies/auth.py", "backend/app/core/security.py", "backend/app/storage/local_storage.py",
             "backend/pyproject.toml", "backend/verification/test_phase48_remediation.py",
             "backend/verification/test_reports_engine.py",
             "tools/audit-phase48.cjs", "tools/validate-security.py", "tools/audit-dependencies.py"]
    hashes = [{"path": file, "sha256": hashlib.sha256((root / file).read_bytes()).hexdigest()} for file in files]
    # Source snapshot is written before tests or remediation. The namespace is always new.
    run("source_snapshot", ["node", str(root / "tools/audit-phase48.cjs"), args.stage, "--fresh"], cwd=root)
    testargs = [str(root / "backend/verification/test_phase48_remediation.py"),
                str(root / "backend/verification/test_phase49_security.py"),
                *[str(root / "backend/verification/test_ai_engine.py") + "::" + test for test in (
                    "test_reject_private_or_injected_input", "test_reject_unsafe_output",
                    "test_dictionary_reuses_project_resource_without_invented_entries",
                    "test_ollama_http_contract_is_mocked_not_live", "test_adapter_failures_are_sanitized")],
                *[str(root / "backend/verification/test_reports_engine.py") + "::" + test for test in (
                    "test_csv_injection", "test_csv_preserves_real_numbers_and_unicode", "test_report_database_failure_is_503")],
                "--confcutdir=" + str(root / "backend/verification"), "-q", "-p", "no:cacheprovider"]
    run("remediation_tests", [sys.executable, "-c", setup + "import pytest; raise SystemExit(pytest.main(" + repr(testargs) + "))"])
    run("installed_dependency_consistency", [sys.executable, "-m", "pip", "check"])
    benchmark = """
import asyncio,json,math,time,tracemalloc
import httpx
from app.main import create_app
from app.dependencies.auth import RateLimiter

def percentile(values,p):
    return sorted(values)[max(0,math.ceil(len(values)*p)-1)]

async def measure():
    app=create_app()
    latencies=[]
    codes=[]
    semaphore=asyncio.Semaphore(4)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://localhost') as client:
        await client.get('/api/v1/health/live')
        tracemalloc.start()
        cpu=time.process_time()
        wall=time.perf_counter()
        async def request():
            async with semaphore:
                start=time.perf_counter()
                response=await client.get('/api/v1/health/live')
                latencies.append((time.perf_counter()-start)*1000)
                codes.append(response.status_code)
        await asyncio.gather(*(request() for _ in range(100)))
        elapsed=time.perf_counter()-wall
        cpu=time.process_time()-cpu
        current,peak=tracemalloc.get_traced_memory()
        tracemalloc.stop()
    limiter=RateLimiter()
    tracemalloc.start()
    start=time.perf_counter()
    accepted=sum(limiter.check_rate_limit('synthetic-'+str(i),5,300)[0] for i in range(5000))
    limiter_ms=(time.perf_counter()-start)*1000
    _,limiter_peak=tracemalloc.get_traced_memory()
    tracemalloc.stop()
    result={'scope':'Local ASGI health only, no lifespan, sockets, DB, login or workload SLA; tracemalloc is Python allocations, not RSS',
            'endpoint':'/api/v1/health/live','requests':100,'concurrency':4,'duration_seconds':elapsed,
            'p50_ms':percentile(latencies,.5),'p95_ms':percentile(latencies,.95),'p99_ms':percentile(latencies,.99),
            'non_200_count':sum(code!=200 for code in codes),'cpu_seconds':cpu,
            'python_current_bytes':current,'python_peak_bytes':peak,
            'limiter_probe':{'checks':5000,'unique_synthetic_keys':5000,'retained_keys':len(limiter.attempts),
                             'accepted':accepted,'duration_ms':limiter_ms,'python_peak_bytes':limiter_peak},
            'acceptance':'Only zero unexpected health errors; no arbitrary latency/production capacity target'}
    print(json.dumps(result))
    if any(code!=200 for code in codes):
        raise SystemExit(1)
asyncio.run(measure())
"""
    run("bounded_local_smoke_measurement", [sys.executable, "-c", setup + "\n" + benchmark])
    if args.full_regression:
        run("existing_integration_regression", [sys.executable, str(root / "tools/validate-integration.py"),
             "--temp-dir", str(args.temp_dir), "--browser"], cwd=root, timeout=360)
    artifact = {"generated_at": datetime.now(timezone.utc).isoformat(), "stage": args.stage,
                "AITHRON_FINAL_VALIDATION": 1, "python": sys.version,
                "environment": {"platform": platform.system(), "architecture": platform.machine(), "logical_cpus": os.cpu_count()},
                "scope": "Local synthetic files, monotonic clock doubles, ASGI health and source; no DB/provider or intrusive network",
                "hashes_before_commands": hashes, "results": results}
    (output / "RESULTS.json").write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output.relative_to(root))
    return 0 if all(result["exit_code"] == 0 for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
