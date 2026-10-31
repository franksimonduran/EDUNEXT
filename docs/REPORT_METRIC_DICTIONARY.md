# Diccionario de métricas — definición v1

Referencia ejecutable: `app/services/report_definitions.py`, METRICS y DEFINITIONS.
Cada respuesta incluye las definiciones. Cambiar una fórmula exige actualizar
versión de definición y pruebas; no reinterpretar silenciosamente históricos.

| ID | Numerador/población | Denominador / unidad | Fuente y estados |
|---|---|---|---|
| completion_percentage | Lecciones estables aplicables completadas | Lecciones aplicables; % | FASE 41, publicación válida y hecho completed |
| submission_percentage | Destinatarios cuya última entrega está recibida | Destinatarios de la tarea; % | Última versión, no total de intentos |
| unique_students_count | COUNT DISTINCT estudiante en intervalo efectivo | Sin denominador; personas | Enrollment, institución/contexto y corte |
| active_courses_count | Cursos activos del ámbito indicado por reporte | Cantidad | Course; ámbito propio o institución explícito |
| applicable_lessons_count | Lecciones del catálogo aplicable actual | Cantidad | FASE 41 |
| completed_lessons_count | Lecciones aplicables distintas completed | Cantidad | LearningProgress, origin progress-engine-v1 e institución |
| earned_achievements_count | Reconocimientos propios earned | Cantidad | StudentAchievement |
| recipients_count | Destinatarios fotografiados por tarea | Destinatarios-tarea | AssignmentTarget; target propio en reporte personal |
| received_count | Último intento recibido por destinatario | Destinatarios-tarea | submitted, late_submitted, feedback_available, revision_requested, closed |
| pending_count | Sin intento, draft o revision_requested | Destinatarios-tarea | En overview propio solo tareas abiertas |
| reviewed_count | Último intento con feedback publicado | Destinatarios-tarea | feedback_available, revision_requested |
| review_pending_count | Último intento recibido sin feedback | Destinatarios-tarea | submitted, late_submitted |
| late_received_count | Último intento con receipt.late=true | Destinatarios-tarea | AssignmentSubmission.receipt |
| overdue_pending_count | Pendiente abierto con plazo efectivo superado | Destinatarios-tarea | FASE 42, incluye prórroga individual |
| published_assignments_count | Tareas institucionales publicadas del planner | Cantidad | Assignment published, creador planner no nulo |
| recipient_assignments_ever_received_count | Targets distintos con alguna recepción histórica | Destinatarios-tarea | submitted_at no nulo; no depende de borrador posterior |
| published_applicable_lessons_count | Lecciones publicadas autorizadas del curso | Cantidad | Mismo statement de catálogo FASE 41 |
| lesson_completions_occurred_count | Finalizaciones propias ocurridas por fecha civil | Cantidad por día | completed_at dentro de [since, until), zona institucional |

## Reglas

Porcentajes: 100 × numerador/denominador, Decimal ROUND_HALF_UP a dos decimales.
Denominador cero devuelve null, no 100 %. No se promedian porcentajes de unidades
de distinto tamaño. Una corrección solicitada puede ser a la vez recibida y pendiente:
esas columnas no son particiones complementarias. Una nueva corrección draft hace
que el último intento esté pendiente; el indicador histórico ever_received conserva
significado distinto y nombre distinto.

Matrículas: effective_date o enrolled_at <= corte < ended_at. Una fila terminal sin
ended_at no permite reconstrucción: se excluye y se informa estado parcial. Se
eligen personas únicas por fila efectiva más reciente y desempate estable, dentro
de año/contexto solicitado; no se duplican traslados.

Series: fechas civiles de la zona institucional, solo días con finalizaciones reales.
Ausencia de eventos no implica ausencia de estudio. Las lecciones históricas de la
serie pueden haber sido retiradas del catálogo actual: no es un porcentaje curricular.

## Interpretación educativa

No se calculan niveles AD/A/B/C ni se convierten a números. Porcentajes de revisión
de lecciones y entrega de tareas no son dominio, inteligencia, motivación, nota
oficial ni participación escolar total. Fuentes no disponibles devuelven estado
explícito y métricas ausentes; cero solo representa un conteo válido en una fuente consultada.
