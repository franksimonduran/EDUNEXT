# Configuración por entornos

Se reutilizan nombres reales de Settings; no se añaden SESSION_SECRET/APP_DEBUG equivalentes. `.env` privado existente no se leyó ni sobrescribió. Plantillas en infra/environments/{development,staging,production}/.env.example. Ejemplos `example.invalid` son reservados, no dominios reales.

| Variable | Tipo / finalidad | Ejemplo no sensible / requisito |
|---|---|---|
| APP_ENV | Enum | development/test/staging/production; desconocido rechazado |
| DEBUG | bool | false; obligatorio false en staging/producción |
| DATABASE_URL | PostgreSQL URL | Rol app y base propios; sin parámetros TLS específicos del driver |
| DATABASE_SSL_MODE | enum | disable solo local/test; verify-full obligatorio staging/producción |
| DATABASE_SSL_CA_FILE | ruta CA | Bundle de confianza montado; obligatorio verify-full |
| DATABASE_CONNECT_TIMEOUT_SECONDS | int 1–60 | 10 |
| DATABASE_COMMAND_TIMEOUT_SECONDS | int 1–300 | 30 |
| SECRET_KEY / CSRF_SECRET_KEY | secretos distintos | Backend solamente; valores de operador, no defaults |
| CORS_ORIGINS | lista de orígenes | Concretos; HTTPS en staging/producción; sin * |
| TRUSTED_HOSTS | lista de hosts | Hosts explícitos staging/producción; no wildcard |
| COOKIE_SECURE / COOKIE_SAMESITE | bool/string | true/lax en HTTPS; HttpOnly refresh en código existente |
| EXPECTED_ALEMBIC_REVISION | revisión esperada | phase45ai según fuente actual; revisar antes de release |
| HEALTHCHECK_TIMEOUT_SECONDS | int 1–10 | 3; errores genéricos sin detalles de DB |
| LOG_LEVEL | nivel | INFO; no cuerpos/secretos en JSON |
| AITHRON_AI_ENABLED / SYNC_ENABLED | flags | false; no implementan motor faltante |
| AI_* | política/proveedor existente | Consultar backend/.env.example; no activar automáticamente |

Local Compose consume PG_ADMIN_PASSWORD, PG_APP_PASSWORD, PG_MIGRATION_PASSWORD solo para roles locales separados. API no recibe contraseña admin/migrator. BUILD_REVISION identifica artefacto local, no prueba commit o release.

`node infra/scripts/prepare-local-env.cjs` crea una NUEVA .env de desarrollo con cinco valores hex aleatorios; O_EXCL impide sobrescribir. No se ejecutó para cambiar credenciales existentes. Revisar ACL en Windows: mode 0600 no garantiza por sí solo DACL restrictiva.

Validación preparada: `python infra/scripts/validate-environment.py`, sin acceso DB y sin imprimir valores; no ejecutada por falta de Python. Pydantic oculta inputs en errores. Validación de estructura no certifica entropía, TLS real, readiness o autorización.

Separar bases, CA, secretos, cuentas, buckets y colectores por entorno. Staging usa datos sintéticos, nunca copia automática de producción. Rotación bajo cambio autorizado: inventariar consumidores → respaldar configuración cifrada → probar secreto nuevo en staging → aprobar → actualizar servicio → verificar sesiones/conexiones → retirar anterior. Cambiar signing key puede invalidar sesiones; no rotar ciegamente.
