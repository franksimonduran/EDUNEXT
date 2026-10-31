# Docker local — preparado, no ejecutado

Docker/Compose no están instalados o disponibles en PATH. Los siguientes comandos corresponden a archivos reales, pero **no fueron probados aquí**. Requieren Docker con contenedores Linux y Compose v2 con --wait.

Desde la raíz en PowerShell, solo para un entorno nuevo sintético:

```powershell
node infra/scripts/prepare-local-env.cjs
docker compose --env-file infra/environments/development/.env config --quiet
docker compose --env-file infra/environments/development/.env build api web
docker compose --env-file infra/environments/development/.env up -d --wait db
docker compose --env-file infra/environments/development/.env --profile tools run --rm migrate
docker compose --env-file infra/environments/development/.env up -d --wait api web
node infra/scripts/smoke-test.cjs http://127.0.0.1:8080
```

Antes de iniciar, verificar que el proyecto/volumen `aithron-local_postgres_data` no corresponde a datos ajenos. No eliminarlo para resolver errores. Inicializador solo se aplica sobre un volumen nuevo; cambiar .env no rota roles de un volumen existente.

Compose publica únicamente 127.0.0.1:8080, HTTP local; DB no tiene ports. API corre UID 10001, read-only, tmpfs, sin capacidades, no-new-privileges y 40s de gracia. Nginx corre como nginx en 8080. Migraciones son tarea explícita separada, no parte del arranque API. Restart limitado a tres fallos; investigar logs, no crear bucles indefinidos.

Las bases de imagen están fijadas por digest consultado (infra/base-images.json); no se descargaron ni escanearon. COPY permite empaquetar la fuente de diccionario existente en la ruta que usa el backend. Pyproject ahora declara paquetes app* y README backend para construir metadata coherente.

La imagen API exige configuración segura por defecto (APP_ENV=production/DEBUG=false); sin variables requeridas debe rechazar inicio. Compose local sobrescribe explícitamente development para su base sintética. No se usa un arranque de imagen vacío como permiso de producción.

Build de release: REQUIRE_LOCK=true por defecto exige backend/requirements.lock completo con hashes. **No existe ese lock y no se inventó.** Solo desarrollo usa REQUIRE_LOCK=false. Generar con resolver aprobado (por ejemplo pip-tools), revisar/resolver en entorno aislado y registrar herramienta/versiones; después construir, escanear y probar. `installed-packages.txt` en imagen registra resolución, no la vuelve reproducible ni es SBOM completo.

No ejecutar down -v, prune o eliminación de volúmenes. Para parar sin borrar: `docker compose --env-file infra/environments/development/.env stop`. Build/arranque/persistencia/graceful shutdown/nginx -t continúan sin verificación real.
