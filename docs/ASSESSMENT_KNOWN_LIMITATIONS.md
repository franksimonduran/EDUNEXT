# FASE 40 — Limitaciones y bloqueos

Fecha: 2026-10-23. **No completa.**

## Implementado y comprobado en esta intervención

- Consultas SQLAlchemy de matrícula/oferta y asignación docente con ámbito.
- Rechazo de escrituras formativas sin propietario estudiantil válido.
- Contratos estrictos iniciales de respuestas y juicios docentes.
- Presentación de pregunta por lista explícita de campos.
- Scoring numérico decimal y distinción de revisión pendiente.
- Pruebas focalizadas; ver `ASSESSMENT_TEST_RESULTS.md`.

## Bloqueos heredados aún abiertos

- FASE 39 tiene rutas que devuelven definiciones y snapshots con soluciones;
  faltan esquemas estudiantiles aplicados a todas las rutas.
- Faltan autorización por propietario/aula en listados de resultados formativos,
  integridad de publicación/revisión e idempotencia/concurrencia verificadas.
- Juegos aceptan indicadores calculados por el cliente; no reutilizar ese flujo
  para resultados académicos.
- Scoring formativo previo tiene rutas sin validar y no se certifica con las
  pruebas numéricas nuevas.
- FASE 38 tiene almacenamiento/descarga incompletos y control editorial sin
  validación suficiente. No usarlo todavía para evidencias privadas de menores.
- OpenAPI tiene operaciones duplicadas de asociación y retirada de recursos de
  lección en routers anteriores.

## FASE 40 pendiente

API de evaluaciones; versiones y convocatorias persistentes; entrega concurrente
e idempotente; correctores restantes; revisión manual; evidencias privadas;
competencias verificadas; criterios; rúbricas; valoración; confirmación;
publicación de resultados; rectificación con historial; auditoría y retención;
pruebas de integración y concurrencia; integración de los tres perfiles.

## Normativa

Se consultó la ficha oficial de la RVM 048-2024 y se confirmó que modifica la
norma aprobada por la RVM 00094-2020. No se verificaron aún el texto completo,
anexos, currículo nacional ni modificaciones posteriores aplicables a 2026.
No hay base para declarar cumplimiento normativo ni imponer automáticamente
obligaciones de conclusión descriptiva como si la revisión normativa estuviera
completa. Consultar `COMPETENCIES_AND_ACHIEVEMENTS.md`.

## Offline y producción

No se conectaron pantallas ni se modificó Service Worker/IndexedDB. No hay entrega
académica offline confirmada, sincronización remota ni protección adicional del
almacenamiento local. Un borrador local sigue siendo provisional.

No se implementaron boletas, promoción, SIAGIE, reportes institucionales completos,
IA ni conversión de porcentajes a niveles de logro.
