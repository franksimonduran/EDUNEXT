import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Run alembic revision
result = subprocess.run(
    [sys.executable, "-m", "alembic", "revision", "--autogenerate", "-m", "Initial migration"],
    capture_output=True,
    text=True
)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)