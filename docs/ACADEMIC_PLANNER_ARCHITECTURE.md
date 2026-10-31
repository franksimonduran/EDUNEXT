# AITHRON Academic Planner — FASE 42

## Arquitectura implementada

- HTTP: `backend/app/api/v1/endpoints/planner.py`, registrado en router v1.
- Entradas: `app/schemas/planner.py`, campos extra prohibidos, límites de texto,
  versiones esperadas e instantes con zona horaria.
- Negocio: AssignmentService, ReinforcementService, CalendarService,
  PlannerSummaryService y PlannerAccessService.
- Consultas: PlannerRepository; algunos listados y proyecciones aún contienen SQL
  en router/servicio. No se declara completa la separación de repositorios.
- Persistencia: Assignment/AssignmentTarget y ReinforcementPlan reutilizados;
  AssignmentVersion, AssignmentSubmission, AssignmentFeedback, CalendarEvent y
  PlannerAudit existentes ampliados con integridad contextual.
- Autorización: sesión/RBAC anterior, perfiles activos, institución, matrícula,
  curso, aula, periodo y TeacherAssignment. No se conceden roles automáticamente.

## Flujos

Crear borrador → editar con revisión esperada → publicar con Idempotency-Key →
fotografía de matrículas → versión inmutable de instrucciones → borrador propio →
guardar → entregar → recibo con fecha servidor → retroalimentación publicada →
corrección autorizada con enlace a entrega previa.

Las escrituras HTTP confirman commit antes de devolver éxito. Los servicios
participan en la transacción del llamador. La fila Assignment se bloquea para
serializar publicación, entregas, revisión, cierre y prórrogas de esa tarea.
Errores SQLAlchemy de las operaciones planner generan rollback y 503 genérico.

## Integridad

Migraciones aditivas `phase42planner` y `phase42integrity`. Las claves compuestas
impiden mezclar destinatario/tarea/versión y antecedente de distinto destinatario.
Checks validan fechas de recepción/publicación, estados y versiones positivas.
Índices cubren ámbito/fecha, destinatarios, feedback, calendario y auditoría.

El calendario proyecta fechas de tareas y refuerzos sin duplicarlas en CalendarEvent.
Evaluaciones confirmadas siguen no disponibles; no se inventan fechas.
No se escriben AssessmentResult, CompetencyAchievement ni AcademicRecord.

## Integración y estado

Agenda estudiante y tareas monitor admiten modo API. Los adjuntos privados,
offline persistente del nuevo flujo y varias pantallas siguen pendientes.
Ver PLANNER_FRONTEND_INTEGRATION, PLANNER_TEST_RESULTS y PLANNER_KNOWN_LIMITATIONS.
