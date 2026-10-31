# Entorno Fase 47

## Actualización 2026-10-27 — entorno aislado operativo

Se localizó Python 3.11 en `C:\Users\simon\AppData\Local\Programs\Python\Python311`.
Se creó un venv nuevo bajo el directorio aprobado `C:\Users\simon\AppData\Local\Temp\opencode`,
sin tocar `backend/.venv`, `.env` o bases existentes. Dependencias instaladas desde
pyproject; se corrigieron SQLAlchemy asyncio y aiofiles faltantes. Versiones resueltas
registradas en evidencia, no se declara lock reproducible con hashes.

Ejemplo reproducible de las comprobaciones no-DB, usando un venv propio:

```powershell
python -m venv "$env:LOCALAPPDATA\Temp\opencode\aithron-verification-new"
& "$env:LOCALAPPDATA\Temp\opencode\aithron-verification-new\Scripts\python.exe" -c "import pathlib,subprocess,sys,tomllib; p=tomllib.loads(pathlib.Path('backend/pyproject.toml').read_text(encoding='utf-8-sig'))['project']; sys.exit(subprocess.call([sys.executable,'-m','pip','install',*p['dependencies'],*p['optional-dependencies']['dev']]))"
$env:AITHRON_FINAL_VALIDATION='1'
& "$env:LOCALAPPDATA\Temp\opencode\aithron-verification-new\Scripts\python.exe" tools/validate-integration.py --temp-dir "$env:LOCALAPPDATA\Temp\opencode" --browser
```

En esta intervención se instalaron las listas de dependencias de pyproject directamente
en el venv, no mediante build del proyecto. El runner también fue ejecutado.
El runner crea CWD vacío, no carga `.env`, pasa configuración sintética y no hereda
URLs/secretos/proveedores de aplicación. No arranca lifespan ni conecta PostgreSQL.
La prueba de conexión histórica se omite expresamente. No se ejecuta conftest destructivo.

Git/Docker/psql y PostgreSQL integrado siguen sin acreditarse. Compose sí existe en
raíz; no se levantó ni se borraron volúmenes. No se cambió CORS/CSRF para hacer pasar tests.
Resultados y ruta exacta del venv usado en el informe de continuación.

## Registro histórico (2026-10-23; no estado vigente del entorno)

Windows; proyecto `D:\Programing\ATHRON EDU`. Node disponible. `python --version` falla: alias Microsoft Store. Git y Docker no aparecen en PATH; no se puede determinar rama/diff ni arrancar Compose. No se leyó ni publicó `.env` privado.

## Comandos ejecutados

```powershell
node tools/audit-phase47.cjs
node tests/phase47-api.cjs
```

## Backend pendiente de ejecución

Instalar/configurar Python >=3.11 y dependencias declaradas en backend/pyproject.toml, revisar .env.example sin publicar secretos. Alembic y pytest existen en el proyecto, pero no se probaron aquí. No se proporciona resultado ficticio de arranque o migración.

La suite backend elimina y recrea tablas. Ahora exige explícitamente TEST_DATABASE_URL de PostgreSQL+asyncpg con base terminada en `_test`, y AITHRON_ALLOW_TEST_SCHEMA_RESET igual al nombre exacto. El operador debe crear/identificar una base desechable propia antes de habilitarla. El sufijo por sí solo no garantiza aislamiento; no apuntar a datos compartidos. No se reinició ninguna base.

## Frontend

Base predeterminada ahora same-origin `/api/v1`. El servidor estático Python descrito en README **no hace proxy API**: por sí solo ya no basta para integración. El anfitrión debe aportar proxy same-origin o configuración pública AITHRON_CONFIG antes de módulos; consultar FRONTEND_BACKEND_CONTRACTS.md. No se afirma haber preparado un launcher integrado reproducible.

No existen Compose en raíz ni PROJECT_STRUCTURE/AGENTS localizados. No se creó infraestructura final de despliegue.
