# IndexedDB

Se conserva `aithron-edu`; versión 9 → 10 aditiva: store nuevo `syncReceipts`,
keyPath `id`. No se eliminan stores/índices ni se cambian claves existentes.

Se reutilizan:
- `syncQueue`: key `opId`, discriminador `protocolVersion=1`, `accountScope`, body
  tipado, estado, attempts y nextAttemptAt. Operaciones demo antiguas quedan intactas.
- `learningProgress`: key `sync-v1:<institución>:<cuenta>:<lección>`, estado provisional
  o confirmado y operationId. No se reinterpreta progreso demo.
- `syncReceipts`: key `<institución>:<cuenta>:<operación>`, metadatos del recibo.

Guardar finalización y cola usa una sola transacción. Confirmar actualiza recibo,
cola y progreso en otra única transacción; no sobrescribe provisional más reciente.
Solo se notifica éxito después de oncomplete. Sin borrado ni limpieza automática.

La partición lógica no cifra el disco. Acceso al mismo perfil del navegador puede
revelar UUID/actividad local. Migración/cierre/versionchange reales requieren navegador.
