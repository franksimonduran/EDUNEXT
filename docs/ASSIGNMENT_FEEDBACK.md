# Retroalimentación formativa

- POST /api/v1/assignment-submissions/{id}/feedback crea borrador con
  expected_revision, feedback_text y requests_revision.
- POST /api/v1/assignment-feedback/{id}/publish publica con expected_revision.
- Permiso: submissions.review_assigned más TeacherAssignment autorizado.
- Solo el autor publica su borrador. El estudiante solo recibe feedback publicado.
- La entrega debe haber sido recibida. Si existe intento posterior se rechaza una
  nueva revisión o publicación pendiente del anterior con 409.
- Publicar cambia a feedback_available o revision_requested y aumenta revisión.
- Una corrección conserva la entrega anterior y tiene nuevo intento.

La revisión es formativa. No modifica AD/A/B/C ni tablas de evaluación oficial.
Los textos deben ser respetuosos, concretos y no contener información sensible.
El servidor limita longitud y exige texto plano; no genera diagnósticos.

No se implementan todavía edición/retirada de feedback ni estados ready/withdrawn.
El frontend docente básico permite guardar y publicar feedback sin solicitar
corrección; la solicitud de corrección sí está disponible por API.
