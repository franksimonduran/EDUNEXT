# Sync — resultados reales y archivos

Intervención local 2026-10-26, evidencia UTC 2026-10-27. Windows, Python 3.11 y Node.
No se instalaron dependencias ni se leyeron secretos. No se conectó a PostgreSQL.

## Resultados finales

| Comprobación | Resultado y alcance |
|---|---|
| `tests/sync-protocol.cjs` | **15 aprobadas**, protocolo y dobles sintéticos de storage/transacción/Web Locks/API |
| `tests/phase48-security.cjs` | **9 comprobaciones aprobadas**, política SW en VM; no navegador |
| Sintaxis Python | AST de los archivos registrados aprobado; no imports/runtime |
| Sintaxis JS | Siete archivos aprobados |
| `verification/test_sync_contract.py` | **Bloqueada al importar**: `No module named pydantic`; cuatro tests definidos no ejecutados |
| Runner completo | **Exit 1**, no aprobación integral |

Evidencia final con hashes de todos los archivos de código intervenidos:
`docs/final/evidence/sync-1793068891666.json`.
Se conserva también la ejecución anterior `sync-1793068660093.json`; no es baseline
sobrescrito. Tras corregir backoff/clasificación se repitieron pruebas pertinentes.

Comando desde raíz:

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
node tools/validate-sync.cjs 'C:\Users\simon\AppData\Local\Programs\Python\Python311\python.exe'
```

Los dobles verifican selección de cuenta, exclusión demo, rechazo de operaciones
privilegiadas, recibos incompatibles, guardado provisional, error de almacenamiento,
abort simulado, 401, backoff/Retry-After y bloqueo sin Web Locks. No demuestran
atomicidad real IndexedDB ni unicidad/transacciones PostgreSQL.

## No ejecutado / bloqueado

FastAPI HTTP/OpenAPI/imports, PostgreSQL, Alembic upgrade/rollback, login/revocación,
RBAC y dos instituciones reales, cambio de matrícula, IDOR/BOLA, recepción concurrente,
commit perdido, navegador/IndexedDB real, migración v9→v10 real, offline/reconexión,
cuota real, dos pestañas/dispositivos, paquetes, cursores/pull y regresión completa.
No hay benchmark de latencia, SQL, descarga o memoria. No se declara producción.

## Archivos creados en esta intervención Sync

- `backend/app/schemas/sync.py`
- `backend/app/db/models/sync_receipt.py`
- `backend/alembic/versions/20261026_phase46_sync_receipts.py`
- `backend/app/repositories/sync_repository.py`
- `backend/app/services/sync_service.py`
- `backend/app/api/v1/endpoints/sync.py`
- `backend/verification/test_sync_contract.py`
- `frontend/js/sync/protocol.js`
- `frontend/js/services/sync-api.service.js`
- `frontend/js/offline/confirmed-sync.js`
- `tests/sync-protocol.cjs`
- `tools/validate-sync.cjs`
- `docs/SYNC_INITIAL_AUDIT_2026-10-26.md`
- `docs/AITHRON_SYNC_ARCHITECTURE.md`
- `docs/SYNC_PROTOCOL_V1.md`
- `docs/SYNC_OPERATION_TYPES.md`
- `docs/SYNC_SERVER_API.md`
- `docs/SYNC_INDEXEDDB_SCHEMA.md`
- `docs/SYNC_IDEMPOTENCY.md`
- `docs/SYNC_CONFLICT_RESOLUTION.md`
- `docs/SYNC_AUTHORIZATION.md`
- `docs/SYNC_PRIVACY_AND_SECURITY.md`
- `docs/SYNC_SHARED_DEVICES.md`
- `docs/SYNC_SERVICE_WORKER.md`
- `docs/SYNC_CONTENT_PACKAGES.md`
- `docs/SYNC_MANIFEST_SPECIFICATION.md`
- `docs/SYNC_OFFLINE_LIMITATIONS.md`
- `docs/SYNC_FRONTEND_INTEGRATION.md`
- `docs/SYNC_KNOWN_LIMITATIONS.md`
- `docs/SYNC_TEST_RESULTS.md`
- `docs/SYNC_DELIVERY_REPORT.md`
- Las dos evidencias JSON citadas.

## Archivos modificados

- `backend/app/db/models/__init__.py`: registro ORM del recibo.
- `backend/app/core/config.py`: gate específico V1 false por defecto; conserva SYNC_ENABLED.
- `backend/app/api/v1/router.py`: registra router sin duplicar backend.
- `backend/app/core/ai_middleware.py`: admite código/detalle configurables, defaults AI conservados.
- `backend/app/main.py`: reutiliza middleware para limitar transporte Sync a 16 KiB.
- `frontend/js/offline/database-schema.js`: v10, recibos aditivos sin borrar stores.
- `frontend/js/student/synchronization.js`: modo API manual en pantalla existente.

Sin Git disponible no se acredita diff contra commit. No se descartaron modificaciones
previas, no se cambiaron migraciones históricas, AD/A/B/C ni datos/volúmenes/IDB reales.
Cambios de fases anteriores en esta sesión no se atribuyen a Sync.
