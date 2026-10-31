# Auditoría inicial Sync — alcance autorizado de desarrollo

Se revisaron README, PROJECT_STRUCTURE, AGENTS, actas 47–50, vulnerabilidades y gate
durante esta sesión. No se certifican como completadas las fases anteriores.
Git no está en PATH; `git status --short --branch` no pudo ejecutarse. No hay `.git`
identificado. Se conservan cambios anteriores y las migraciones existentes.

## Estado observado antes de modificar Sync

- IndexedDB única `aithron-edu`, versión 9, stores de contenidos, respuestas,
  borradores, learningProgress, syncQueue y metadatos. Hay datos demo no particionados.
- `offline/sync-queue.js` registra operaciones locales pero `syncNow` no envía.
- Panel estudiante tiene botón deshabilitado; paneles administrativos son locales.
- SW público v2 excluye API/bearer, no intercepta escrituras, conserva cachés antiguas
  pero no las consulta. No debe relajarse para descargar datos privados.
- ProgressService.record permite reutilizar autorización de matrícula y versión;
  hace flush, no commit: apto para transacción conjunta con recibo.
- No existe módulo backend Sync ni change feed confirmado.
- Fase 40 académica incompleta; prácticas/juegos no acreditan fuentes seguras
  suficientes. Recursos binarios reales permanecen bloqueados según A48-06.
- AI tiene adaptador existente, sin proveedor operativo verificado. Insights parcial.

## Riesgos y alcance

No migrar automáticamente datos demo, respuestas o colas antiguas. No habilitar
descargas privadas con el SW público. No aceptar notas, matrículas o publicaciones
mediante cola. Solo se preparará `lesson.progress.complete` con recibo persistente,
autorización actual y commit individual; estará deshabilitada por defecto hasta
validación PostgreSQL aislada. Sin prácticas, entregas, paquetes o pull ficticios.

Requiere migración aditiva de recibos. El almacenamiento de progreso local debe
usar claves particionadas; la cola existente se reutilizará con discriminador de
protocolo, sin convertir operaciones antiguas. Nuevos recibos locales, si se usan,
irán en el mismo IndexedDB mediante migración aditiva, sin eliminar stores.

Python 3.11 disponible; pytest/SQLAlchemy ausentes en los intérpretes probados.
No se conecta a bases configuradas desconocidas ni se instala/activa infraestructura.
Pruebas E2E, migraciones, auth real y tenant siguen bloqueadas; producción NO-GO.
