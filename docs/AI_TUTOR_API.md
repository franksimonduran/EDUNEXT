# Tutor con contexto publicado

POST /api/v1/ai/tutor/messages exige texto 2–1500 caracteres, lesson_id autorizado,
acción definida y Idempotency-Key UUID. El límite institucional puede ser menor.
No acepta grado, estudiante, institución, modelo o aprobación desde el navegador.

El estudiante utiliza matrícula/oferta actual. Un docente puede indicar classroom_id
con ai.tutor.use_assigned_context y asignación válida; UI docente específica pendiente.
El catálogo está acotado a primeras 100 lecciones/contextos. Grado 4/5/6 viene de Course/Grade.

Se extraen description/content y bloques de texto/paragraph/heading publicados.
No se envían preguntas, correct_answer, evaluaciones ni snapshot completo. Título
solo no es contexto suficiente. Fragmento máximo 4000 caracteres, marcado si fue limitado.
Fuentes de salida se construyen con IDs/versiones/títulos reales por backend, no por el modelo.
Son contexto consultado, no garantía de que cada afirmación esté fundamentada.

Se suspende ayuda generativa si hay un AssessmentAttempt propio registrado en curso
sin entrega. Es una barrera conservadora; no cubre evaluaciones externas/no registradas
ni reemplaza el flujo académico incompleto de FASE 40.

No se almacena historial de preguntas/respuestas. GET conversations informa esa
decisión; consulta individual devuelve 404. La pantalla mantiene hilos solo en memoria,
pero las solicitudes al modelo son de un turno: no se reenvía conversación completa.

Proveedor ausente/deshabilitado/error: 503 sin respuesta demo. Capacidad real actual:
generación bloqueada hasta configurar y validar un modelo local autorizado.
