"""Audit a resolved synthetic venv using a separate pip-audit installation.

Only package names/versions are sent to PyPI advisory lookup. No app imports or .env.
No --fix, package upgrade, Docker scan or legal/license certification is performed.
"""

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--runtime-python", required=True)
    parser.add_argument("--auditor-python", required=True)
    parser.add_argument("--temp-dir", type=Path, required=True)
    args = parser.parse_args()
    if os.environ.get("AITHRON_FINAL_VALIDATION") != "1":
        raise SystemExit("AITHRON_FINAL_VALIDATION=1 required")
    root = Path(__file__).resolve().parents[1]
    output = root / "docs/final/evidence" / ("phase48-dependencies-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))
    output.mkdir(exist_ok=False)
    work = Path(tempfile.mkdtemp(prefix="phase48-advisories-", dir=args.temp_dir))
    allowed = ("PATH", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA")
    env = {key: os.environ[key] for key in allowed if key in os.environ}
    env["PYTHONUTF8"] = "1"
    installed = subprocess.check_output([args.runtime_python, "-m", "pip", "list", "--format=json", "--disable-pip-version-check"],
                                        cwd=work, env=env, text=True, encoding="utf-8")
    packages = json.loads(installed)
    requirements = output / "RESOLVED_REQUIREMENTS.txt"
    requirements.write_text("\n".join(package["name"] + "==" + package["version"] for package in packages) + "\n", encoding="utf-8")
    results = []
    for format_, filename in (("json", "ADVISORIES.json"), ("cyclonedx-json", "SBOM.cdx.json")):
        command = [args.auditor_python, "-m", "pip_audit", "-r", str(requirements), "--no-deps", "--disable-pip",
                   "--vulnerability-service", "pypi", "--progress-spinner", "off", "--timeout", "15",
                   "--cache-dir", str(work / "cache"), "--format", format_, "--output", str(output / filename)]
        process = subprocess.run(command, cwd=work, env=env, text=True, encoding="utf-8", errors="replace",
                                 capture_output=True, timeout=180)
        results.append({"format": format_, "exit_code": process.returncode, "output": process.stdout + process.stderr})
        print(format_, process.returncode)
    (output / "RESULTS.json").write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(), "AITHRON_FINAL_VALIDATION": 1,
        "service": "PyPI advisory service via pip-audit", "scope": "Resolved disposable application/development venv including its pip/setuptools; not Docker, model, OS or frontend dependency coverage",
        "package_count": len(packages), "results": results,
        "limitations": "Advisory matches require contextual triage; pip check is not a vulnerability audit; no automatic fixes or license approval",
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output.relative_to(root))
    return max(result["exit_code"] for result in results)


if __name__ == "__main__":
    raise SystemExit(main())
