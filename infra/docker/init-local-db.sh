#!/bin/sh
# Fresh local volume only. Never run against an existing institutional database.
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 \
  --set app_password="$AITHRON_APP_PASSWORD" \
  --set migration_password="$AITHRON_MIGRATION_PASSWORD" <<'SQL'
CREATE ROLE aithron_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'app_password';
CREATE ROLE aithron_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'migration_password';
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO aithron_app;
GRANT USAGE, CREATE ON SCHEMA public TO aithron_migrator;
ALTER DEFAULT PRIVILEGES FOR ROLE aithron_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aithron_app;
ALTER DEFAULT PRIVILEGES FOR ROLE aithron_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO aithron_app;
SQL
