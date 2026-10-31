# EDUNEXT Sync — implementación parcial

Continuación local 2026-10-26 (evidencia UTC 2026-10-27). No certifica Fases 33–45.
Auditoría previa: `SYNC_INITIAL_AUDIT_2026-10-26.md`.

Flujo preparado: bootstrap autenticado → IndexedDB existente → operación tipada
→ envío manual bajo Web Lock → validación actual en FastAPI → ProgressService
→ progreso y recibo en transacción PostgreSQL → commit → recibo local transaccional.
La única operación implementada es `lesson.progress.complete`. No modifica notas.

Capas: router `endpoints/sync.py`, contratos `schemas/sync.py`, `SyncService`,
`SyncRepository`, modelo `SyncOperationReceipt`. Reutiliza auth, RBAC y ProgressService;
no duplica matrículas/cursos/lecciones. Modelo de recibos importado al metadata ORM.

Cliente: `sync-api.service.js`, `sync/protocol.js`, `offline/confirmed-sync.js`.
Reutiliza `syncQueue` y `learningProgress` en `aithron-edu`; añade `syncReceipts`
en versión 10. No importa colas demo. No existe otra BD o Service Worker.

PostgreSQL sigue siendo autoritativo; los UUID del contexto son precondiciones,
no permisos. El SW público permanece sin cambios, sin cachear APIs privadas.

**No habilitado:** deben estar activos tanto `SYNC_ENABLED` existente como
`SYNC_PROTOCOL_V1_ENABLED` nuevo (false por defecto). No se cambia `.env`.
El operador no debe habilitarlos antes de validar migración, auth, privacidad y E2E
en base sintética aislada. Una bandera no constituye verificación automática.

Paquetes, pull/change feed, cursores, prácticas y entregas no están implementados.
No se sustituyen por respuestas de éxito ficticias. Estado final parcial/NO-GO.
