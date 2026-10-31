# Autorización y privacidad

Se reutilizan JWT, AuthSession y resolución de permisos de FASE 35. El nombre del
rol no autoriza una operación. Las nuevas migraciones registran permisos sin grants.

| Recurso | Regla |
|---|---|
| Crear/editar/publicar tarea | Permiso específico y TeacherAssignment de curso/aula/periodo |
| Destinatario | Matrícula activa y efectiva, usuario activo, institución y año |
| Entrega propia | Perfil de sesión, destinatario real y matrícula original para escribir |
| Entrega docente | Institución de tarea y asignación docente actual |
| Feedback | Revisión autorizada; borrador no visible al estudiante |
| Refuerzo | Institución en contexto del plan, docente asignado o propietario |
| Evento institucional | calendar.manage_institution |
| Evento aula/curso | calendar.manage_assigned y asignación vigente |
| Resumen institucional | planner.read_institution_aggregates; solo cantidades generales |

Consultas filtran institución antes de devolver registros. No se aceptan porcentajes,
notas ni aprobación docente en entregas estudiantiles. Las respuestas exitosas del
router incluyen Cache-Control private, no-store. No se registran cuerpos de entregas
en PlannerAudit; se registran operación, actor, institución y referencias mínimas.

Pruebas: monitor no asignado, institución ajena, otro estudiante, feedback borrador
oculto, ID de tarea inaccesible, matrícula futura para evento directo y permiso de
agregación ausente son rechazados. Se verificó fallo PostgreSQL como 503 genérico.
No se certifica aún concurrencia independiente, login real/revocación ni auditoría
integral del backend anterior. El middleware global heredado conserva limitaciones
de logging fuera del límite SQLAlchemy del planner.

Sin rankings, diagnósticos, exposición pública de refuerzos ni actualización de notas.
