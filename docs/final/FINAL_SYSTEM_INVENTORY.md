# Inventario final de fuente y estado de las 50 fases

No acredita ejecución, publicación ni aceptación. Datos de PostgreSQL vivo no inspeccionados. Inventario completo de archivos/páginas/servicios/routers/modelos/recursos/pruebas en FINAL_INVENTORY.json; las rutas son extracción estática, no OpenAPI runtime.

Páginas HTML: 176. Decoradores HTTP: 260. Migraciones: 11. Tablas declaradas en fuente: 62.

| Fase | Módulo | Estado actual | Fundamento/limitación | Código o evidencia |
|---|---|---|---|---|
| 1 | Login | Parcial | Formulario/cliente existentes; login público probado, autenticación PostgreSQL no verificada. | `frontend/login.html`, `frontend/js/pages/login.js` |
| 2 | Registro y recuperación | Parcial | Interfaces presentes; recuperación/envío de correo y altas reales no operativos verificados. | `frontend/register.html`, `frontend/forgot-password.html`, `frontend/js/services/auth.service.js` |
| 3 | Selección de perfil | Parcial | Vista demo y resolución por sesión en código; permisos reales no probados E2E. | `frontend/role-selection.html`, `frontend/js/core/navigation.js` |
| 4 | Dashboard Estudiante | Solo demostración | Catálogo y cifras ficticias, no dashboard autenticado confirmado. | `frontend/student/index.html`, `frontend/js/data/student-demo.data.js` |
| 5 | Cursos y lecciones | Solo demostración | Servicios frontend consultan catálogo demo; autorización/versiones servidor sin E2E. | `frontend/js/services/course.service.js`, `frontend/js/services/lesson.service.js` |
| 6 | Prácticas y juegos | Parcial | UI/datos demo y backend previo; flujo persistente integrado no certificado. | `frontend/js/data/practices-demo.data.js`, `frontend/js/data/games-demo.data.js`, `backend/app/api/v1/endpoints/practice_attempts.py` |
| 7 | Tutor | Parcial | Demo/API inicial; generación real no verificada. | `frontend/student/tutor.html`, `frontend/js/services/ai-api.service.js` |
| 8 | Traductor y diccionario | Parcial | Diccionario local y API inicial; no traducción generativa probada. | `frontend/student/traductor.html`, `frontend/js/data/dictionary-demo.data.js` |
| 9 | Pronunciación | Parcial | Referencia/funciones locales; voz y análisis fonético servidor no verificados. | `frontend/student/pronuncia.html`, `docs/AI_KNOWN_LIMITATIONS.md` |
| 10 | Evaluaciones estudiante | Solo demostración | Interfaz demo no acredita registro académico oficial. | `frontend/student/evaluaciones.html`, `frontend/js/data/evaluations-demo.data.js` |
| 11 | Progreso y logros | Parcial | Demo más integración inicial API 41; competencias confirmadas incompletas. | `frontend/student/progreso.html`, `frontend/js/services/progress-api.service.js` |
| 12 | Agenda | Parcial | Modo demo y API planner inicial, sin flujo real completo probado. | `frontend/student/agenda.html`, `frontend/js/services/academic-planner-api.service.js` |
| 13 | Perfil estudiante | Solo demostración | Preferencias/perfil local no equivalen a persistencia institucional verificada. | `frontend/student/perfil.html`, `frontend/js/data/profile-demo.data.js` |
| 14 | Sync frontend | Solo demostración | Preparación/cachés locales, no sincronización confirmada. | `frontend/student/sincronizacion.html`, `frontend/js/offline/sync-queue.js` |
| 15 | Dashboard Monitor | Solo demostración | Datos ficticios y avisos explícitos. | `frontend/monitor/index.html`, `frontend/js/monitor/dashboard.js` |
| 16 | Aulas y estudiantes | Parcial | Vistas demo y API académica existente, asignación/aislamiento sin validación actual completa. | `frontend/monitor/aulas.html`, `frontend/js/services/monitor-students.service.js` |
| 17 | Evaluaciones docentes | Solo demostración | Borradores/programación local no son publicación académica confirmada. | `frontend/monitor/evaluaciones.html`, `frontend/js/services/monitor-evaluations.service.js` |
| 18 | Notas y reportes | Parcial | Notas demo y reportes API parciales; no niveles oficiales calculados por aciertos. | `frontend/monitor/notas.html`, `frontend/monitor/reportes.html` |
| 19 | Tareas y refuerzos | Parcial | Propuestas locales más conexión planner inicial; entregas cruzadas sin prueba real actual. | `frontend/monitor/tareas.html`, `frontend/monitor/refuerzos.html` |
| 20 | Insights frontend | Solo demostración | Tarjeta/reglas sobre datos ficticios, sin motor institucional validado. | `frontend/js/monitor/dashboard.js` |
| 21 | Calendario docente | Parcial | Organización local y API calendario inicial, sin validación docente real. | `frontend/monitor/calendario.html`, `frontend/js/monitor/calendar-views.js` |
| 22 | Estudio de contenidos | Solo demostración | Borradores IndexedDB y vista previa no equivalen a publicación institucional. | `frontend/monitor/cursos.html`, `frontend/js/monitor/content-studio.js` |
| 23 | Perfil Monitor | Solo demostración | Preferencias/perfil local; sesión/edición institucional no probadas. | `frontend/monitor/perfil.html`, `frontend/js/services/monitor-profile.service.js` |
| 24 | Dashboard Administrador | Solo demostración | Métricas y propuestas locales identificadas como ficticias. | `frontend/admin/index.html`, `frontend/js/admin/dashboard.js` |
| 25 | Usuarios y roles UI | Parcial | Directorio/borradores demo y API personas; no administración visual real completa probada. | `frontend/admin/usuarios.html`, `frontend/js/services/admin-users.service.js` |
| 26 | Organización académica UI | Parcial | API existe; varias pantallas mantienen propuestas demo. | `frontend/admin/matriculas.html`, `frontend/js/services/academic-organization.service.js` |
| 27 | Revisión editorial UI | Solo demostración | Preparación/revisión local no certifica publicación del servidor. | `frontend/admin/revision-contenidos.html`, `frontend/js/services/admin-content-review.service.js` |
| 28 | Reportes institucionales UI | Parcial | Modo API inicial; fuentes académicas incompletas. | `frontend/admin/reportes.html`, `frontend/js/services/reports-api.service.js` |
| 29 | Panel Sync | Solo demostración | Diagnóstico local no acredita operaciones/recibos remotos. | `frontend/admin/sync.html`, `frontend/js/services/admin-sync.service.js` |
| 30 | Configuración y seguridad UI | Solo demostración | Propuestas/preferencias locales no aplican infraestructura institucional. | `frontend/admin/configuracion.html`, `docs/phase30.md` |
| 31 | Auditoría frontend | Parcial | Herramientas/documentos previos; no auditoría exhaustiva actual aprobada. | `docs/FRONTEND_FINAL_VALIDATION.md`, `tools/audit-phase31.cjs` |
| 32 | Contratos | Parcial | Contratos documentados, compatibilidad total no verificada. | `docs/BACKEND_INTEGRATION_PLAN.md`, `docs/FRONTEND_BACKEND_CONTRACTS.md` |
| 33 | FastAPI | Parcial | Aplicación/routers en fuente, ejecución actual bloqueada. | `backend/app/main.py`, `backend/app/api/v1/router.py` |
| 34 | PostgreSQL | Parcial | Modelos/migraciones presentes; esquema vivo y restricciones no verificados aquí. | `backend/app/db/models`, `backend/alembic/versions` |
| 35 | Auth y RBAC | Parcial | Código y pruebas de cliente; sesiones/cookies/RBAC real sin prueba PostgreSQL actual. | `backend/app/services/auth_service.py`, `backend/app/dependencies/auth.py` |
| 36 | Personas e instituciones | Parcial | Router/modelos existentes, flujo multiinstitución real pendiente. | `backend/app/api/v1/endpoints/people.py` |
| 37 | Organización académica API | Parcial | Servicios/migraciones e idempotencia en código; no nueva ejecución ni UI completa. | `docs/phase37.md`, `backend/app/api/v1/endpoints/enrollments.py` |
| 38 | Contenidos API | Parcial | Routers/workflow, cambios de autorización sin ejecución completa actual. | `backend/app/services/lesson_service.py`, `backend/app/api/v1/endpoints/content_publications.py` |
| 39 | Prácticas y juegos API | Parcial | Routers existentes; intentos/persistencia cruzada sin aceptación E2E. | `backend/app/api/v1/endpoints/practices.py`, `backend/app/api/v1/endpoints/game_sessions.py` |
| 40 | Evaluaciones académicas | Bloqueado | Fundación parcial, falta flujo académico operativo completo. | `docs/ASSESSMENT_KNOWN_LIMITATIONS.md` |
| 41 | Progreso y logros API | Parcial | Finalizaciones/historial implementados inicialmente; fuentes confirmadas incompletas. | `backend/app/api/v1/endpoints/progress.py`, `docs/PROGRESS_KNOWN_LIMITATIONS.md` |
| 42 | Planner API | Parcial | Tareas/entregas/calendario iniciales, offline/adjuntos y E2E pendientes. | `backend/app/api/v1/endpoints/planner.py`, `docs/PLANNER_KNOWN_LIMITATIONS.md` |
| 43 | Reportes API | Parcial | Fuentes disponibles y privacidad en código, sin aceptación integral actual. | `backend/app/api/v1/endpoints/reports.py`, `docs/REPORT_KNOWN_LIMITATIONS.md` |
| 44 | Motor Insights | No implementado | No router/motor registrado encontrado; demo no sustituye backend. | `backend/app/api/v1/router.py`, `docs/AI_KNOWN_LIMITATIONS.md` |
| 45 | AI Gateway | Parcial | Gateway/adaptador/contexto; modelo operativo, voz y evaluación real bloqueados. | `backend/app/api/v1/endpoints/ai.py`, `docs/AI_KNOWN_LIMITATIONS.md` |
| 46 | Motor Sync confirmado | No implementado | Sin router/motor servidor confirmado; stores demo no bastan. | `backend/app/api/v1/router.py`, `docs/SYNC_INTEGRATION_STATUS.md` |
| 47 | Integración | Bloqueado | Flujos críticos reales incompletos, acta sin aceptación. | `docs/PHASE_47_ACCEPTANCE.md` |
| 48 | Calidad y seguridad | Bloqueado | Hallazgos altos/evidencia crítica pendiente; sin aceptación. | `docs/PHASE_48_ACCEPTANCE.md`, `docs/VULNERABILITY_REGISTER.md` |
| 49 | Infraestructura | Parcial | Archivos preparados, sin build/DB/staging/restore verificados. | `docs/PHASE_49_ACCEPTANCE.md`, `docker-compose.yml` |
| 50 | Validación y entrega | Parcial | Cierre técnico/documental candidato; no aceptación integral, piloto ni lanzamiento autorizados. | `docs/final/PHASE_50_ACCEPTANCE.md`, `docs/final/FINAL_GO_NO_GO_DECISION.md` |
