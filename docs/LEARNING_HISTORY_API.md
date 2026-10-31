# Historial de aprendizaje

`GET /api/v1/progress/me/history`: consulta propia autenticada y paginada.

Los hechos de LearningProgress originados por este motor producen dos tipos:
`lesson_started` y `lesson_completed`. El ID de evento se compone de ID de progreso
y tipo; una petición repetida no crea otro evento. Fechas de servidor, orden
descendente por fecha e ID, filtros en PostgreSQL antes del conteo/paginación.

Campos: event_id, lesson_id, course_id, event_type, occurred_at, recorded_at,
enrollment_id, lesson_version_id y source. No se devuelven respuestas, claves,
notas, familia ni diagnósticos.

Las versiones y matrículas de inicio/finalización se conservan separadas cuando
son distintas. Un traslado no reasigna retrospectivamente el contexto de inicio.
El historial institucional propio permanece aunque el contenido se retire del
catálogo actual. No ofrece acceso interinstitucional.

Pendientes: eventos derivados de prácticas, juegos, evaluaciones, publicación de
resultados y concesión de insignias en la línea temporal unificada. Las insignias
sí conservan fuente y fecha en su tabla.
