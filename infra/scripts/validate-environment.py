"""Validate existing Pydantic configuration without database/network access."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

if __name__ == "__main__":
    try:
        from app.core.config import settings
        print("Configuration structure validated; service readiness, secrets quality and release authorization are NOT certified.")
    except Exception:
        raise SystemExit("Configuration validation failed. Values withheld; check the documented required variable names.") from None
