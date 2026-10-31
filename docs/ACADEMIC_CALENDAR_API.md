# Calendario académico

| Método y ruta /api/v1 | Función |
|---|---|
| GET /academic-calendar/me?start=YYYY-MM-DD&end=YYYY-MM-DD | Proyección personal |
| GET /calendar-events | Administración de eventos institucionales, paginada |
| GET /calendar-events/{id} | Evento permitido; as_teacher=true para gestión |
| POST /calendar-events | Crear evento real, 201 |
| PATCH /calendar-events/{id} | Reemplazo validado con expected_revision |
| POST /calendar-events/{id}/cancel | Cancelación conservando registro |

Ámbitos: institution, classroom y course. Evento de curso exige aula y curso.
Gestionar institución exige calendar.manage_institution; aula/curso exige
calendar.manage_assigned y asignación vigente. Estudiante consulta con calendar.read_own.

El calendario personal combina CalendarEvent, plazos de AssignmentTarget y
ReinforcementPlan propios. IDs de presentación llevan prefijo event:, assignment:
o reinforcement:. Se consulta la fuente original; no se copian tareas a eventos.
Las evaluaciones se declaran not_available por falta de programación confirmada.

La consulta personal ordena por fecha institucional, instante e ID, con paginación
1–100. Incluye cancelados identificados como tales. Eventos puntuales de entrega
usan el mismo instante en inicio y fin en la proyección; CalendarEvent exige un
intervalo positivo. No hay recurrencia ni bloqueo por solapamientos informativos.

La consulta directa de evento valida matrícula efectiva, aula/año activo y fechas
del año; no basta un estado active con fecha de alta futura.
No hay aún calendario personal del monitor ni filtros completos por curso/tipo.
