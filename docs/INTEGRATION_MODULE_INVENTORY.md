# Inventario de módulos — Fase 47

> Fotografía histórica 2026-10-23. Para el estado actualizado, consultar
> [continuación 2026-10-27](PHASE_47_CONTINUATION_2026-10-27.md): existen routers
> Insights y Sync parciales, y hay pruebas Python/ASGI no destructivas ejecutadas.
> Las afirmaciones de ausencia de PROJECT_STRUCTURE/AGENTS/Compose no describen
> el repositorio actual; el inventario nuevo enumera lo realmente encontrado.

La presencia de archivos no prueba ejecución. Estados conservadores basados en fuentes y documentación previa, no en nuevas pruebas PostgreSQL.

| Módulo / fase | Frontend / servicio | Backend / datos | Estado real de integración |
|---|---|---|---|
| Auth 01–03/35 | login, role-selection; auth.service | auth, AuthSession, User, roles/permisos | Implementado sin validación E2E en este entorno |
| Personas 25/36 | admin/usuarios; admin-users | people, perfiles y membresías | Implementado sin integración visual completa verificada |
| Organización 26/37 | admin/aulas, matriculas; academic-organization | years/periods/classrooms/enrollments/assignments | API implementada; pantallas mayormente demo; integración parcial |
| Contenido 05/22/27/38 | aprende/curso/unidad/leccion, editor monitor | courses/units/lessons/resources/reviews/publications/versions | API existente; conexión completa no demostrada |
| Prácticas/juegos 06/39 | practica/juego; practice/game.service | practices/exercises/attempts/game_sessions | Parcial; no se acredita flujo persistente completo |
| Evaluaciones 10/17/40 | evaluaciones; evaluation/monitor-evaluations | Consultar ASSESSMENT_KNOWN_LIMITATIONS; no router académico completo registrado | Bloqueado para integración completa |
| Progreso/logros 11/41 | progreso; progress-api | progress, finalizaciones e historial | Integración inicial; no equivale a competencias confirmadas |
| Planner 12/19/21/42 | agenda, tareas; academic-planner-api | planner, assignments/submissions/calendar | Parcial; borradores offline autenticados pendientes |
| Reportes 18/28/43 | reportes; reports-api | reports, fuentes académicas disponibles | Parcial; evaluaciones/competencias no disponibles |
| Insights 20/44 | Referencias visuales no equivalen a motor | Sin router registrado | No implementado como backend verificable |
| AI 07–09/45 | tutor/traductor/pronuncia; ai-api | ai, adaptador Ollama, cuotas/política | Parcial; generación y voz real bloqueadas según documentación previa |
| Sync 14/29/46 | sync, offline, IndexedDB, sw.js | Sin router Sync registrado | Demostrativo/local; push/pull confirmado bloqueado |
| Perfiles/configuración 13/23/30 | servicios de preferencias/perfil | Contratos específicos por revisar | Preferencias locales no equivalen a persistencia institucional |

## Evidencias y permisos

Todos los archivos HTML, CSS, scripts y servicios transitivos están enumerados en INTEGRATION_MATRIX.md y el JSON de inventario. Endpoints en INTEGRATION_ENDPOINT_INVENTORY.md. Los permisos no se infieren de etiquetas UI: deben contrastarse con `backend/app/dependencies` y dependencias de cada handler.

Pruebas disponibles: lista completa en el JSON. Las suites phase41/42/43/45 usan APIs simuladas en navegador según documentación previa. No se ejecutaron ahora ni se adoptan sus resultados históricos como actuales.

Ausentes en raíz: PROJECT_STRUCTURE.md, AGENTS.md, database/, content/, scripts/, .github/, docker-compose.yml, compose.yaml. Sí existen `backend/scripts`, `backend/alembic` y `frontend/assets`; no se crean carpetas paralelas.
