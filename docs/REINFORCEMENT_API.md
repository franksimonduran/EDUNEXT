# Planes docentes de refuerzo

Se reutiliza ReinforcementPlan, sin crear copias de lecciones o resultados.

- POST /api/v1/reinforcement-plans: curso, aula, periodo, estudiante, objetivo,
  instrucciones, lesson_ids publicados, disponibilidad y plazo.
- GET /api/v1/reinforcement-plans/me: planes propios no borrador, paginados.
- GET /api/v1/reinforcement-plans/{id}: lectura propia; as_teacher=true exige
  permiso reinforcement.manage y asignación docente.
- POST /api/v1/reinforcement-plans/{id}/{assign|start|complete|review|cancel}:
  expected_revision obligatorio.

Crear/asignar/revisar/cancelar exige reinforcement.manage. Estudiante propio con
reinforcement.read_own puede iniciar y completar dentro de la ventana y con
matrícula original vigente. Flujo: draft → assigned → in_progress → completed →
reviewed. Cancelación autorizada conserva historial. Asignar revalida versiones
publicadas y contexto académico. Completar es participación declarada, no dominio.

Se conserva contexto institucional/matrícula/periodo y versión de lección en JSON
del modelo reutilizado. Aún faltan claves compuestas para todo ese contexto.
La prueba PostgreSQL recorre creación, asignación, inicio, finalización, revisión,
consulta propia y rechazo a otro estudiante.

No existen recomendaciones automáticas ni incorporación de evidencias confirmadas
de FASE 40. Estos planes son decisiones docentes, no diagnósticos ni EDUNEXT AI.
No hay todavía catálogo docente paginado de planes ni interfaz completa conectada.
