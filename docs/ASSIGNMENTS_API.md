# API de tareas

Todas las rutas llevan `/api/v1`. Se exige sesión válida y permisos efectivos.

| Operación | Método/ruta | Permiso |
|---|---|---|
| Contextos docentes | GET /planner-context/me | assignments.create_assigned |
| Crear borrador | POST /assignments | assignments.create_assigned |
| Listado docente | GET /assignments | assignments.read_assigned |
| Listado propio | GET /assignments/me | assignments.read_own |
| Detalle propio | GET /assignments/{id} | assignments.read_own |
| Detalle docente | GET /assignments/{id}?as_teacher=true | assignments.read_assigned |
| Editar borrador | PATCH /assignments/{id} | assignments.update_assigned |
| Publicar | POST /assignments/{id}/publish | assignments.publish_assigned |
| Cerrar / archivar | POST /assignments/{id}/close o /archive | assignments.update_assigned |
| Destinatarios | GET /assignments/{id}/targets | assignments.read_assigned |
| Prórroga individual | POST /assignment-targets/{id}/extend | assignments.update_assigned |

Crear requiere course_id, classroom_id, academic_period_id, title, instructions,
available_from, due_at; admite unit_id/lesson_id publicados compatibles, tipo,
política tardía/reentrega, máximo de intentos y student_ids opcional.
Sin student_ids se fotografía el aula al publicar. No se incluyen altas posteriores.
Repetir destinatarios individuales en la entrada se rechaza con 422.

PATCH solo permite título, instrucciones y fechas del borrador, con expected_revision.
Solo el autor edita el borrador. Instrucciones publicadas son inmutables: crear
otra tarea para cambiarlas. Una prórroga no cambia el snapshot original; se conserva
fecha anterior/nueva y actor en auditoría.

Publicar exige Idempotency-Key; repetir payload equivalente no duplica versión ni
destinatarios. La misma clave con payload diferente produce 409. Versiones y
destinatarios se crean en la misma transacción. Permisos no sustituyen asignación docente.

Estados expuestos: draft, published, closed y archived. La persistencia legacy
usa completed para closed. Archivar exige borrador o tarea previamente cerrada.
Publicar con disponibilidad futura no expone instrucciones antes de available_from.
No hay scheduler ni transición scheduled/cancelled implementada.

Listados: page >= 1, page_size 1–100; docente filtra curso/aula/periodo.
Errores principales: 401, 403, 404, 409, 422 y 503.
