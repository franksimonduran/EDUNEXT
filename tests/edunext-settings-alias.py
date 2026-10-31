"""Loads Settings in an empty working directory with synthetic environment only."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import json
import time

root = Path(__file__).resolve().parents[1]
allowed = ('PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'LOCALAPPDATA')
base = {key: os.environ[key] for key in allowed if key in os.environ}
base.update(APP_ENV='test', SECRET_KEY='synthetic-settings-test-not-for-deployment',
    CSRF_SECRET_KEY='synthetic-settings-csrf-not-for-deployment', DATABASE_URL='postgresql+asyncpg://synthetic:synthetic@127.0.0.1:1/edunext_unreachable', AITHRON_AI_ENABLED='false')
cases = [({}, False), ({'AITHRON_AI_ENABLED':'true'}, True), ({'EDUNEXT_AI_ENABLED':'true'}, True),
    ({'EDUNEXT_AI_ENABLED':'false','AITHRON_AI_ENABLED':'true'}, False)]
code = 'import sys;sys.path.insert(0,' + repr(str(root/'backend')) + ');from app.core.config import settings;print(settings.AITHRON_AI_ENABLED)'
with tempfile.TemporaryDirectory(prefix='edunext-settings-', dir=Path(os.environ['LOCALAPPDATA'])/'Temp/opencode') as directory:
    for overrides, expected in cases:
        result = subprocess.run([sys.executable,'-c',code], cwd=directory, env={**base,**overrides}, capture_output=True, text=True)
        if result.returncode or result.stdout.strip() != str(expected):
            raise SystemExit('Synthetic settings alias check failed; no private environment loaded.')
report = {'pass':True,'cases':len(cases),'scope':'Settings import in empty CWD with synthetic values. No dotenv secrets, database or provider requests.'}
if os.environ.get('AITHRON_FINAL_VALIDATION') == '1':
    directory=root/'docs/final/evidence'/f'edunext-settings-{time.time_ns()}'
    directory.mkdir()
    (directory/'SETTINGS_ALIAS.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
