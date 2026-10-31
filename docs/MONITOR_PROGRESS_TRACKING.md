# Seguimiento docente implementado

`GET /api/v1/monitors/me/student-progress?classroom_id=UUID&course_id=UUID`.

Exige `progress.read_assigned` y TeacherAssignment activo del MonitorProfile real,
curso y aula de la misma institución; verifica vigencia de asignación, aula/año y
compatibilidad de grado. Un rol ADMIN con ese permiso no evita la asignación.

`period_id` opcional debe coincidir con el de la asignación encontrada. La
resolución de varias asignaciones/periodos simultáneos aún necesita una política
más completa; no se presenta como seguimiento histórico por periodo.

La población son estudiantes activos con matrícula activa vigente en el aula/año.
Se pagina en PostgreSQL y se agrupan finalizaciones para la página con una consulta;
no se consulta una vez por estudiante. Se reutiliza el mismo catálogo aplicable que
las consultas propias. Campos mínimos: student_id, course_id, lecciones aplicables,
completadas, porcentaje y fuente. No se envían nombres, notas o respuestas.

Sin actividad significa cero finalizaciones de lecciones aplicables, no falta de
capacidad/interés. Con catálogo vacío, porcentaje null.

Prueba ejecutada: docente asignado obtiene el mismo conteo del estudiante;
docente sin asignación recibe ForbiddenError. La pantalla del Monitor aún no está
conectada; existe cliente JS `getMonitorProgress` para integración posterior.
