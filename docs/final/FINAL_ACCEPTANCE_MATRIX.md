# Matriz de aceptación funcional

Los 28 requisitos no se dan por aceptados al pasar contratos de fuente o demos. Prerrequisitos/método/expectativa por caso en FINAL_ACCEPTANCE_CASES.json. Responsable de aceptación: por designar. Schemas/permisos/modelos concretos y comportamiento deben contrastarse en ejecución; inventario de declaraciones disponible, no certificación de vínculos.

| ID | Requisito | Prioridad | Pantalla | Código/servicio | Ruta a verificar | Resultado real | Incidencia |
|---|---|---|---|---|---|---|---|
| R01 | Login auténtico | critical | `frontend/login.html` | `frontend/js/services/auth.service.js` | POST /api/v1/auth/login | BLOCKED | F50-01 |
| R02 | Logout efectivo | critical | `frontend/role-selection.html` | `backend/app/services/auth_service.py` | POST /api/v1/auth/logout | BLOCKED | F50-01 |
| R03 | Sesiones | critical | `frontend/login.html` | `backend/app/dependencies/auth.py` | GET /api/v1/auth/me | BLOCKED | F50-01 |
| R04 | RBAC | critical | `frontend/admin/roles-permisos.html` | `backend/app/services/authorization_service.py` | GET /api/v1/auth/me | BLOCKED | F50-02 |
| R05 | Navegación autenticada | high | `frontend/role-selection.html` | `frontend/js/core/navigation.js` | GET /api/v1/auth/me | BLOCKED | F50-01 |
| R06 | Cursos autorizados | critical | `frontend/student/aprende.html` | `frontend/js/services/course.service.js` | GET /api/v1/courses | BLOCKED | F50-02 |
| R07 | Lecciones y recursos | high | `frontend/student/leccion.html` | `backend/app/services/lesson_service.py` | GET /api/v1/lessons/{lesson_id} | BLOCKED | F50-02 |
| R08 | Prácticas | critical | `frontend/student/practica.html` | `backend/app/api/v1/endpoints/practice_attempts.py` | POST /api/v1/practices/{practice_id}/attempts | BLOCKED | F50-01 |
| R09 | Persistencia de respuestas | critical | `frontend/student/ejercicio.html` | `backend/app/api/v1/endpoints/practice_attempts.py` | PUT /api/v1/practice-attempts/{attempt_id}/responses/{exercise_id} | BLOCKED | F50-01 |
| R10 | Evaluaciones autorizadas | critical | `frontend/student/evaluaciones.html` | `docs/ASSESSMENT_KNOWN_LIMITATIONS.md` | No contrato operativo verificado | BLOCKED | F50-03 |
| R11 | Resultados académicos publicados | critical | `frontend/student/resultado-evaluacion.html` | `docs/ASSESSMENT_KNOWN_LIMITATIONS.md` | No contrato operativo verificado | BLOCKED | F50-03 |
| R12 | Progreso consistente | high | `frontend/student/progreso.html` | `frontend/js/services/progress-api.service.js` | GET /api/v1/progress/me | BLOCKED | F50-01 |
| R13 | Logros únicos | high | `frontend/student/logros.html` | `backend/app/api/v1/endpoints/progress.py` | GET /api/v1/progress/me/achievements | BLOCKED | F50-01 |
| R14 | Tarea y retroalimentación cruzada | critical | `frontend/monitor/tareas.html` | `backend/app/api/v1/endpoints/planner.py` | POST /api/v1/assignment-submissions/{submission_id}/submit | BLOCKED | F50-01 |
| R15 | Agenda y fechas | high | `frontend/student/agenda.html` | `frontend/js/services/academic-planner-api.service.js` | GET /api/v1/academic-calendar/me | BLOCKED | F50-01 |
| R16 | Aulas del Monitor | critical | `frontend/monitor/aulas.html` | `backend/app/api/v1/endpoints/classrooms.py` | GET /api/v1/monitors/me/classrooms | BLOCKED | F50-02 |
| R17 | Revisión docente | critical | `frontend/monitor/tareas.html` | `backend/app/api/v1/endpoints/planner.py` | POST /api/v1/assignment-submissions/{submission_id}/feedback | BLOCKED | F50-02 |
| R18 | Registros y AD/A/B/C protegidos | critical | `frontend/monitor/notas.html` | `docs/ASSESSMENT_KNOWN_LIMITATIONS.md` | No contrato operativo verificado | BLOCKED | F50-03 |
| R19 | Administración autorizada | critical | `frontend/admin/usuarios.html` | `backend/app/api/v1/endpoints/people.py` | GET /api/v1/users | BLOCKED | F50-02 |
| R20 | Revisión y publicación editorial | critical | `frontend/admin/revision-contenidos.html` | `backend/app/api/v1/endpoints/content_publications.py` | POST /api/v1/content-versions/{version_id}/publish | BLOCKED | F50-02 |
| R21 | Reportes reales | high | `frontend/admin/reportes.html` | `frontend/js/services/reports-api.service.js` | GET /api/v1/reports/{scope}/{kind} | BLOCKED | F50-01 |
| R22 | Insights explicables | high | `frontend/monitor/index.html` | `backend/app/api/v1/router.py` | No contrato operativo verificado | NOT_IMPLEMENTED | F50-04 |
| R23 | AI informa capacidades verdaderas | high | `frontend/student/tutor.html` | `frontend/js/services/ai-api.service.js` | GET /api/v1/ai/capabilities | BLOCKED | F50-05 |
| R24 | Sync con recibo confirmado | critical | `frontend/student/sincronizacion.html` | `backend/app/api/v1/router.py` | No contrato operativo verificado | NOT_IMPLEMENTED | F50-04 |
| R25 | Offline conserva trabajo y cuentas | critical | `frontend/student/descargas.html` | `frontend/js/offline/database.js` | No contrato operativo verificado | BLOCKED | F50-06 |
| R26 | Aislamiento multiinstitucional | critical | `frontend/admin/index.html` | `backend/app/dependencies/auth.py` | GET /api/v1/institutions/{institution_id} | BLOCKED | F50-02 |
| R27 | Errores fiables en todos los flujos | high | `frontend/login.html` | `frontend/js/services/auth.service.js` | No contrato operativo verificado | PARTIAL | F50-01 |
| R28 | Documentación reproducible | medium | `README.md` | `docs/manuals/INSTALLATION_GUIDE.md` | No contrato operativo verificado | PARTIAL | F50-07 |
