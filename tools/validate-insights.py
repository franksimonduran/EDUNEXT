"""Non-destructive rule/syntax evidence; run from repository root with Python 3.11+."""

import ast
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


if os.environ.get("AITHRON_FINAL_VALIDATION") != "1":
    raise SystemExit("Set AITHRON_FINAL_VALIDATION=1 before recording evidence")
root = Path(__file__).resolve().parents[1]
paths = [
    "backend/app/rules/insight_rules.py",
    "backend/app/services/insights_service.py",
    "backend/app/api/v1/endpoints/insights.py",
    "backend/app/api/v1/router.py",
    "backend/verification/test_insight_rules.py",
    "frontend/js/services/insights-api.service.js",
    "tools/validate-insights.py",
]
checks = []
for name in paths:
    raw = (root / name).read_bytes()
    if name.endswith(".py"):
        ast.parse(raw.decode("utf-8-sig"))
    checks.append({"path": name, "sha256": hashlib.sha256(raw).hexdigest()})
test = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "verification",
                       "-p", "test_insight_rules.py", "-v"], cwd=root / "backend",
                      capture_output=True, text=True, timeout=60)
js = subprocess.run(["node", "--input-type=module", "--check"],
                    input=(root / paths[5]).read_text(encoding="utf-8"),
                    capture_output=True, text=True, timeout=60)
now = datetime.now(timezone.utc)
evidence = {
    "generated_at": now.isoformat(), "AITHRON_FINAL_VALIDATION": "1",
    "python": sys.version, "checks": checks,
    "rules": {"exit_code": test.returncode, "output": test.stdout + test.stderr},
    "javascript_syntax": {"exit_code": js.returncode, "output": js.stdout + js.stderr},
    "scope": "Synthetic rules and syntax only; no database, API, auth or browser validation",
}
target = root / "docs" / "final" / "evidence" / ("insights-" + now.strftime("%Y%m%dT%H%M%S%fZ") + ".json")
with target.open("x", encoding="utf-8") as stream:
    json.dump(evidence, stream, ensure_ascii=False, indent=2)
print(target.relative_to(root))
print("rules exit:", test.returncode, "JS syntax exit:", js.returncode)
raise SystemExit(0 if test.returncode == js.returncode == 0 else 1)
