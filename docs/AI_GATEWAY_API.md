# API AITHRON AI

Base `/api/v1/ai`; JWT/sesión, cuenta activa, institución y permiso por operación.
Respuestas exitosas privadas/no-store; sin secretos o URL del proveedor.

| Método/ruta | Función y control |
|---|---|
| GET /capabilities, /status | Disponibilidad por permiso, política y proveedor |
| GET /configuration | ai.config.read_institution |
| PATCH /configuration | ai.config.manage_institution; expected_revision |
| GET /tutor/contexts | Lecciones publicadas autorizadas, máximo 100 |
| POST /tutor/messages | ai.tutor.use_own o use_assigned_context; Idempotency-Key UUID |
| GET /tutor/conversations | Historial deshabilitado explícitamente, sin mensajes |
| GET /tutor/conversations/{id} | 404: no hay historial persistido |
| POST /translate | ai.translate.use_own o ai.translate.use; clave UUID |
| GET /dictionary/search | ai.dictionary.read; q 1–80, language es/en, paginación 1–50 |
| GET /dictionary/entries/{id} | Entrada real y procedencia, mismo permiso |
| GET /pronunciation/references | ai.pronunciation.use_own; referencia local |
| GET /pronunciation/references/{id} | Referencia existente autorizada |
| POST /pronunciation/sessions | Perfil estudiante; sesión reference_only, 201 |
| GET /pronunciation/sessions/{id} | Propietario, institución y vigencia |
| POST /pronunciation/sessions/{id}/attempts | 503 después de comprobar propietario: audio no recibido |
| GET /usage/me | Consumo propio permitido; unidades/costo desconocidos null |
| GET /usage/institution | ai.usage.read_institution_aggregates; supresión de grupos pequeños |

Tutor: text, lesson_id, classroom_id opcional docente, action explain/hint/example/rephrase.
Traducción: text, source_language y target_language es/en distintos. No detección automática.
Política: habilitaciones, aprobación institucional, límites y revisión esperada.
No hay selección arbitraria de proveedor/modelo/temperatura/herramientas desde cliente.

Respuesta generada: service, text plano, origin local_model, status generated_unverified,
generated_at, fuentes reales seleccionadas, idiomas declarados, operation_id y advertencia.
Nunca se devuelve una respuesta estática como resultado de un proveedor fallido.

Estados de capacidad: available, disabled, not_authorized, not_approved,
provider_not_configured, temporarily_unavailable, resource_unavailable.
Errores: 401, 403, 404, 409, 413, 422, 429 y 503. Cuerpo IA máximo 16 KiB,
incluido transporte sin Content-Length; límites de texto inferiores por schema/política.
