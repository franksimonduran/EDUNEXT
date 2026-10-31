# EDUNEXT Sync — integración Fase 47

## Actualización 2026-10-27

Existe router Sync limitado de Fase 46 y migración aditiva de recibos, no aplicada.
OpenAPI y contratos HTTP probados: gate deshabilitado, mismatch cuenta→409,
campos protegidos→422, transporte→413, commit simulado fallido→retryable sin confirmar.
No son recibos PostgreSQL reales ni prueba multiinstitucional persistente.

Cliente usa base `aithron-edu` v10, stores existentes y recibos aditivos; la vista API
ahora se limpia al cambiar/cerrar sesión. Cola demo no se convierte a operaciones reales.
Pruebas de protocolo con dobles pasan; Web Locks/IndexedDB reales pendientes.
SW público conservado; 9 verificaciones VM de caché pasan.

No se habilitan gates, paquetes, pull/cursores o entregas. La matriz completa y
límites están en SYNC_DELIVERY_REPORT y el informe de continuación de Fase 47.
Las afirmaciones de ausencia de router y política SW inferiores son históricas.

## Observaciones históricas (2026-10-23)

`SYNC_ENABLED` existe como configuración; no demuestra motor. No hay router Sync registrado en api/v1/router.py. El inventario JSON enumera archivos offline/sync/storage existentes.

Service Worker usa static/content y shell monitor. No se reemplazó ni se eliminó ninguna caché o store. No se migró IndexedDB ni se borró trabajo pendiente.

Push, pull, cursores, recibos de PostgreSQL, conflictos entre dispositivos y separación autenticada no están verificados ni integrados en esta fase. Descarga local no equivale a paquete servidor validado por checksums.

Riesgo: sw.js usa caché de recursos compartida por origen y solo excluye `/api/` explícitamente. Deben comprobarse respuestas privadas, rutas configurables, recursos autenticados y cambio de cuenta antes de habilitar uso real multiusuario. No se afirma que exista una filtración explotada; tampoco que el aislamiento esté garantizado.
