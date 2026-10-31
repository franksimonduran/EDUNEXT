# Correcciones aplicadas

## Continuación 2026-10-27

| Archivo | Defecto / cambio mínimo | Verificación |
|---|---|---|
| `backend/app/dependencies/auth.py` | Cota de claves, expiración monotónica, exclusión RLock, HMAC de identificador/IP y Retry-After redondeado hacia arriba | Pruebas de capacidad/expiración/reset/privacidad/concurrencia local; probe 5.000 claves |
| `backend/app/storage/local_storage.py` | Validar antes de abrir destino; lectura limitada y completa incluso con read parcial; archivo temporal + fsync/replace; contención/rutas Windows; metadata por bloques | Archivos sintéticos reales conservados ante exceso/fallo; sin activar endpoints de descarga/subida |
| `backend/app/core/security.py` | Require aud/iss/exp/iat/nbf en decode JWT | Cuatro fallos reproducidos antes; pruebas de omisiones pasan después |
| `backend/pyproject.toml` | Suelo build setuptools>=84.1.0 | Herramientas del venv propio actualizadas y re-auditadas; no build/imagen certificado |
| `backend/verification/test_reports_engine.py` | Fixture ASGI de fallo DB usa localhost permitido, no host test inválido | Prueba 503/rollback sin filtrar detalles; sin relajar TrustedHost/CORS |
| `tools/audit-phase48.cjs` | Namespace fresh, no sigue symlinks, excluye venv/build y conserva baseline; incluye webmanifest | Inventarios antes/después con valores de secretos omitidos |
| `backend/verification/test_phase48_remediation.py`, `tools/validate-security.py`, `tools/audit-dependencies.py` | Pruebas, medición limitada y advisory/SBOM reproducibles en entornos propios | 61 tests acotados + regresiones seleccionadas pasan; SCA mantiene avisos abiertos |

No se reescriben resultados históricos ni actas. Detalles y artefactos inmutables
en `PHASE_48_CONTINUATION_2026-10-27.md`. No hubo revisión independiente de otro auditor.

## Registro histórico

| Archivos | Causa / corrección | Resultado de verificación |
|---|---|---|
| frontend/sw.js | Caché por extensión/HTML sin privacidad → solo directorios públicos, sin query/bearer, respeta no-store/private/Vary, namespaces nuevos | 4 fallos iniciales; suite VM ampliada a 9 checks; no borra caches/IDB; offline de páginas autenticadas queda deshabilitado hasta diseño seguro |
| frontend/js/services/auth.service.js | Timer terminaba en cabeceras → cubre lectura del cuerpo; download comparte validación; respuesta/refresh tardío tras cambio de sesión → epoch | Suites phase47, resiliencia HTTP loopback y sesión pasan |
| backend/app/services/unit_service.py | Lectura directa → verifica curso institucional padre | Prueba creada, no ejecutada |
| backend/app/services/lesson_service.py | Lecturas/escrituras/asociaciones sin curso scoped; consulta errónea Unit como Course → helper de curso padre | Revisión fuente; runtime pendiente |
| backend/app/services/educational_resource_service.py | Asociaciones/remociones sin curso padre; imports select/LessonResource faltantes | Revisión fuente; runtime pendiente |
| backend/app/services/authorization_service.py | Helper genérico aprobaba sin comprobar recurso → fail closed; no consumidores encontrados | Prueba escrita, no ejecutada |
| backend/app/services/auth_service.py | Refresh concurrente sin bloqueo → FOR UPDATE; mensajes/timing de locked/inactivo → credenciales inválidas y verificación dummy | Revisión fuente, sin prueba de concurrencia/timing real |
| backend/app/core/middleware.py | Request ID arbitrario, excepción/trace con valores → ID acotado y error por clase; no-store/nosniff/referrer | Revisión fuente, runtime pendiente |
| backend/app/db/engine.py | DEBUG podía imprimir parámetros SQL privados → echo=False | Revisión fuente |
| backend/app/core/config.py | Producción aceptaba defaults inseguros → validador fail closed; CORS explícito | Pruebas escritas, no ejecutadas |
| backend/app/main.py | Metadatos de error inaccesibles por CORS → expone Request-ID y Retry-After | Runtime pendiente |
| backend/app/api/v1/endpoints/educational_resources.py | Éxito sin persistir/streaming → 503 explícito conservando autorización | Runtime pendiente; no almacena ni borra archivos |
| backend/app/storage/resource_validation.py | Tipo desconocido aprobado/RIFF ambiguo/import rígido → rechazo y discriminador | Pruebas escritas, no ejecutadas |
| backend/pyproject.toml | EmailStr requiere dependencia adicional → email-validator declarado | No instalado/resuelto aquí |
| .gitignore | No existía protección básica de secretos/artefactos locales | Añadido; no elimina ni deja de rastrear archivos ya comprometidos |

No se cambiaron migraciones, índices, pool, notas, matrículas ni respuestas. No se deshabilitó RBAC/CSRF. Revisión independiente de otro auditor no realizada.
