# Sync e IndexedDB

No hay motor Sync registrado verificable: SYNC_ENABLED no implementa bootstrap/push/pull. No se simulan recibos confirmados ni conflictos de servidor. AITHRON INSIGHTS también carece de backend registrado; reglas/privacidad/recomendaciones no pueden auditarse como motor operativo.

Store observado `aithron-evaluations-demo`, attempts por id, versión 1: no demuestra partición por cuenta. El inventario previo lista otros módulos offline/locales; no se migraron ni borraron stores o respuestas. No se agregó otra IndexedDB o SW.

SW fue restringido y pasa pruebas VM; no se certifica aislamiento completo porque subsisten caches/lectores locales antiguos y falta navegador real. No se guardaron tokens en IDB/localStorage/Cache Storage por estos cambios. El cliente mantiene sessionStorage existente.

Bloqueados: cambio A→B→A, cola persistente real, checksums/paquetes parciales, dos dispositivos, idempotencia, cursor/recibo perdido, conflictos de versión/matrícula y reconexión masiva. No habilitar sincronización arbitraria de tablas ni notas/roles/matrículas. Provisional debe permanecer provisional hasta confirmación real.
