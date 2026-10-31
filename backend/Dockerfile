# Release builds fail closed until a reviewed, fully hashed requirements.lock exists.
# Build from repository root so the existing dictionary source can be packaged.
ARG PYTHON_IMAGE=python:3.12-slim-bookworm@sha256:6a0e06f5ba0b373d051aabd3fffb9b873f27f9a2a3a14bcbe37dee6f0e3bbc70
FROM ${PYTHON_IMAGE} AS dependencies
ARG REQUIRE_LOCK=true
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
WORKDIR /build
COPY backend/pyproject.toml backend/README.md ./
COPY backend/app ./app
COPY backend/ /lock-source/
RUN python -m venv /opt/venv \
    && if [ "$REQUIRE_LOCK" = "true" ]; then \
         test -s /lock-source/requirements.lock \
         && /opt/venv/bin/pip install --require-hashes -r /lock-source/requirements.lock; \
       elif [ "$REQUIRE_LOCK" = "false" ]; then \
         /opt/venv/bin/pip install .; \
       else exit 1; fi \
    && /opt/venv/bin/pip freeze > /opt/venv/installed-packages.txt

FROM ${PYTHON_IMAGE} AS runtime
ARG BUILD_REVISION=unversioned-local
LABEL org.opencontainers.image.title="AITHRON EDU API" \
      org.opencontainers.image.revision="${BUILD_REVISION}"
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
ENV APP_ENV=production DEBUG=false AITHRON_AI_ENABLED=false SYNC_ENABLED=false
RUN groupadd --gid 10001 aithron && useradd --uid 10001 --gid 10001 --no-create-home aithron
WORKDIR /srv/backend
COPY --from=dependencies /opt/venv /opt/venv
COPY --chown=10001:10001 backend/app ./app
COPY --chown=10001:10001 backend/alembic ./alembic
COPY --chown=10001:10001 backend/alembic.ini ./alembic.ini
COPY --chown=10001:10001 frontend/js/data/dictionary-demo.data.js /srv/frontend/js/data/dictionary-demo.data.js
USER 10001:10001
EXPOSE 8000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["python", "-c", "import urllib.request; from app.core.config import settings; request=urllib.request.Request('http://127.0.0.1:8000'+settings.API_V1_PREFIX+'/health/ready', headers={'Host':settings.TRUSTED_HOSTS.split(',')[0].strip()}); urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=4).read()"]
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-proxy-headers", "--no-access-log", "--timeout-graceful-shutdown", "30"]
