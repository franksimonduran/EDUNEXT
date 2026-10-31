# Entregas privadas de tareas

## Operaciones

- POST /api/v1/assignments/{id}/submissions: crear/recuperar borrador propio,
  Idempotency-Key obligatorio; 201.
- GET /api/v1/assignment-submissions/{id}: respuesta propia y feedback publicado.
  `as_teacher=true` exige submissions.read_assigned y asignación real.
- PATCH /api/v1/assignment-submissions/{id}: expected_revision y response_text
  hasta 20000 caracteres; solo borrador.
- POST /api/v1/assignment-submissions/{id}/submit: expected_revision más
  Idempotency-Key. Confirma estado y recibo solo tras commit.
- POST /api/v1/assignment-submissions/{id}/resubmit: Idempotency-Key; nuevo
  borrador enlazado, sin sobrescribir el anterior.
- GET /api/v1/assignments/{id}/submissions: listado docente paginado de versiones.
- GET /api/v1/assignments/{id}/summary: conteo por destinatario y última versión.

El servidor obtiene el estudiante de la sesión; no acepta student_id, score,
reviewed ni niveles de logro en el payload estudiantil.

## Políticas

Se exige tarea publicada, destinatario propio y matrícula original vigente para
escribir. Tras traslado se retiene lectura histórica propia, pero se rechaza nueva
escritura contra matrícula original inactiva. Reentregar exige revision_requested,
allow_resubmission y máximo de intentos disponible.

El recibo contiene confirmation_reference, received_at, late,
assignment_version_id y deadline_at_submission. La hora servidor determina atraso;
exactamente en el límite se admite. El recibo no es una nota oficial.

Unicidad target/attempt y claves compuestas protegen tarea, versión y antecedente.
Revisión optimista y bloqueo de tarea protegen contra sobrescrituras. La prueba
actual verifica repetición secuencial y revisión obsoleta; no dos sesiones concurrentes.

## Archivos

Solo respuesta de texto está habilitada. POST .../{id}/attachments comprueba
propiedad y devuelve 503: no existe todavía un flujo de adjuntos privados validado
con descarga autorizada. No se almacenan archivos en recursos públicos como atajo.
