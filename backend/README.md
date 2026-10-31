# EDUNEXT API

FastAPI, PostgreSQL, SQLAlchemy 2 and Alembic. Python >=3.11.

From this directory, after preparing an isolated environment and installing the
dependencies in pyproject.toml: `python -m uvicorn app.main:app --host 127.0.0.1`.
No migration is executed by that command. Read the root README and
`../docs/DOCKER_DEPLOYMENT.md` for the infrastructure preparation status.

Production is blocked by the Phase 48 acceptance gate. Upload/download storage,
Insights and confirmed Sync are not operational services merely because an API
image can be built. Never use real student data in tests.
