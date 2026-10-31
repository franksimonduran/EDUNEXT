# Contrato API de reportes

Base: `/api/v1/reports`. Autenticación JWT/sesión y RBAC existentes. Respuestas
exitosas privadas: Cache-Control private, no-store; Vary Authorization, Cookie;
X-Content-Type-Options nosniff.

| Método/ruta | Permisos |
|---|---|
| GET /catalog | Identidad activa; solo devuelve definiciones autorizadas |
| GET /me/overview | reports.read_own + progress.read_own + assignments.read_own |
| GET /me/courses | reports.read_own + progress.read_own |
| GET /me/activities | reports.read_own + assignments.read_own |
| GET /me/history | reports.read_own + progress.read_own |
| GET /me/activity_series | reports.read_own + progress.read_own |
| GET /monitor/context | reports.read_assigned y perfil/asignaciones propios |
| GET /monitor/classrooms | reports.read_assigned + progress.read_assigned y asignación real |
| GET /monitor/assignments | reports.read_assigned + submissions.read_assigned y asignación real |
| GET /institution/context | reports.read_institution_aggregates |
| GET /institution/enrollments | reports.read_institution_aggregates |
| GET /institution/overview | reports.read_institution_aggregates |
| GET /institution/courses | reports.read_institution_aggregates |
| POST /exports | Permisos de lectura/fuente más permiso de exportación del ámbito |

Para cada ámbito existen rutas /practices, /assessments y /competencies: devuelven
`source_not_available` sin cifras ni niveles inventados. No son reportes operativos
de dichas fuentes. Códigos desconocidos: 404; no hay consultas libres por nombre de tabla.

## Filtros por código

- me.courses: course_id.
- me.activities: course_id, academic_period_id.
- me.history: course_id, since/until conscientes de zona; ambos o ninguno.
- me.activity_series: since/until obligatorios, intervalo máximo 366 días, final exclusivo.
- monitor.classrooms/assignments: classroom_id y course_id obligatorios; academic_period_id opcional.
- institution.enrollments: academic_year_id, academic_period_id, cutoff con zona.
- institution.courses: course_id, grade_id.
- overview: sin filtros de ámbito/fecha; muestra su definición actual explícita.

Todos los reportes de filas admiten page >= 1 y page_size 1–100. Orden estable.
Se rechazan campos desconocidos, parámetros repetidos y filtros no admitidos por
la definición, en lugar de ignorarlos. No se admite student_id/institution_id libre.
OpenAPI documenta parámetros generales; catálogo determina filtros aplicables a cada código.

## Respuesta

metadata: report_id, definition_version, institution_id, generated_at, timezone,
filters efectivos, population_definition, data_status, sources, limitations,
official_document=false. Además metrics, columns, rows, total, page, page_size y definitions.

Estados: calculated_from_server_records, partial, no_applicable_records,
source_not_available, suppressed_small_cohort. Supresión devuelve total null y
filas vacías, nunca cantidad oculta en otra columna.

Ejemplo: GET /reports/monitor/assignments?classroom_id=UUID&course_id=UUID&page_size=25.
Exportar: POST /reports/exports con
`{"report_code":"me.courses","format":"csv","filters":{}}`.

Errores: 401 sin sesión, 403 sin permiso/relación, 404 recurso/código inaccesible,
409 exportación fuera de alcance, 422 entrada/filtros inválidos y 503 persistencia.
No se implementan PDF, trabajos asíncronos ni descarga por export_id.
