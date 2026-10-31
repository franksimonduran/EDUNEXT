# Resultados reales — FASE 43

Fecha: 2026-10-23. Windows, Python 3.11, PostgreSQL local, asyncpg, SQLAlchemy 2,
FastAPI, pytest, Node y Chromium/Playwright del entorno.

## Comandos ejecutados

| Comando | Resultado real |
|---|---|
| python -m pytest verification --confcutdir=verification -q | **66 passed, 1 warning in 19.56s** |
| node tests/phase43.cjs | PASS |
| node tests/phase42.cjs | PASS |
| node tests/phase41.cjs | PASS |
| node tests/phase37.cjs | PASS |
| python -m alembic upgrade head | phase42integrity → phase43reports aplicado |
| python -m alembic current | phase43reports (head) |
| python -m scripts.verify_reports_runtime | Liveness 200; catálogo sin sesión 401 |
| Mismo script, sesión real de reportes | repeatable read; statement_timeout 10s |
| Mismo script, OpenAPI | filtros presentes |

node --check pasó para components/reports-api-view.js, services/reports-api.service.js,
services/auth.service.js, admin/reports.js, monitor/grades.js y student/progress.js.

Warning pytest: deprecación heredada de argon2.__version__ en Passlib. Al generar
OpenAPI se observaron dos advertencias heredadas de operation IDs duplicados en
educational_resources.py. No hay fallos pendientes entre los comandos finales anteriores.

## Alcance backend

66 casos incluyen fundamentos de evaluación, progreso, planner y **21 casos de
reportes** (incluidos parámetros CSV). No equivalen a 66 flujos E2E.

Los fixtures usan esquemas aleatorios transaccionales con rollback. Se ejecuta la
migración real de reportes sobre tablas previas creadas desde metadata. La aplicación
configurada también recibió alembic upgrade head; no se borraron tablas/volúmenes.

Datos ficticios: institución A con seis estudiantes, institución B con cinco en
prueba específica, perfiles activos, monitor y usuario no asignado, año/periodo,
grado cuarto y quinto para celdas pequeñas, aula, catálogo publicado, tarea, entregas,
feedback y corrección. No se crearon valoraciones ficticias en modelos inexistentes.

Comprobaciones: catálogo por permisos; propios coherentes con FASE 41; otro estudiante
sin finalizaciones ajenas; usuario inactivo rechazado; tareas coherentes con FASE 42;
reentrega sin duplicar destinatarios; docente no asignado; matrícula histórica antes/
después de traslado sin duplicar; intervalo incompleto declarado parcial; dos
instituciones pobladas con conteos independientes; curso ajeno rechazado; filtros
de institución/estudiante no admitidos; datos pequeños y totales complementarios
suprimidos; fuente no disponible sin métricas; denominador 6 y recepción 1 = 16,67 %;
historial real; borrador editorial excluido; cero real en institución vacía;
agrupación UTC→Lima en día anterior; corte futuro rechazado; paginación; CSV Unicode,
fórmulas y números negativos; exportación sin permiso; límite de 100 filas; auditoría;
503 sin detalle SQL; conteo de consultas. Se comprueba que reportes no crean entregas.

## Navegador

FASE 43 usa API simulada en Chromium a 390×844: tres perfiles, contextos autorizados,
tabla accesible, medidor textual, paginación, descarga CSV leída, XSS escapado,
403 que elimina datos anteriores y supresión institucional sin tabla reveladora.
FASES 42/41/37 repiten sus suites existentes. No se verificó login JWT real desde navegador.

## Rendimiento medido

Ejecución puntual previa con seis destinatarios y una tarea:
`SQL=6, rows=1, elapsed_ms=36.87` para servicio de entregas docente.
No es benchmark de producción; ver REPORT_PERFORMANCE.md.

## Bloqueado / no ejecutado

- Prácticas/juegos confirmados, resultados académicos publicados y AD/A/B/C vigente:
  fuentes anteriores no operativas; sin pruebas de distribución académica ficticia.
- PDF: no implementado; rechazo de formato probado, no generación.
- URLs caducadas/archivos diferidos: no aplican al CSV directo sin almacenamiento.
- Login/revocación real, cambio de sesión, navegador contra BD/API reales, lector
  físico, concurrencia independiente, gran volumen, memoria y EXPLAIN: no ejecutados.
- Regresión completa legacy FASES 33–42 y todas las pantallas: no ejecutada.

## Archivos creados

- backend/app/schemas/report.py
- backend/app/services/report_definitions.py
- backend/app/services/report_service.py
- backend/app/repositories/report_repository.py
- backend/app/db/models/report_access.py
- backend/app/api/v1/endpoints/reports.py
- backend/app/exporters/__init__.py
- backend/app/exporters/csv_exporter.py
- backend/alembic/versions/20261023_phase43_reports.py
- backend/scripts/verify_reports_runtime.py
- backend/verification/test_reports_engine.py
- frontend/js/services/reports-api.service.js
- frontend/js/components/reports-api-view.js
- tests/phase43.cjs
- Los trece documentos REPORT*/STUDENT_REPORTS/MONITOR_REPORTS/INSTITUTION_REPORTS de FASE 43.

## Archivos modificados

- README.md
- backend/app/core/config.py
- backend/app/core/planner_rules.py
- backend/app/db/models/__init__.py
- backend/app/api/v1/router.py
- backend/app/repositories/progress_repository.py
- backend/app/services/planner_access_service.py
- backend/app/services/planner_summary_service.py
- frontend/js/services/auth.service.js
- frontend/js/admin/reports.js
- frontend/js/monitor/grades.js
- frontend/js/student/progress.js

Sin .git disponible, no se pudo revisar rama ni diff contra una base. Las rutas
anteriores reflejan las operaciones de esta continuación, no un inventario Git.

## Aceptación

**Parcialmente completa** por fuentes bloqueadas, reportes/pantallas aún pendientes
y validación incompleta de escala/privacidad avanzada/E2E real. No se implementó FASE 44.
