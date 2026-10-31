# API Insights implementada

Prefijo `/api/v1`. Sesión y autorización existentes; no se otorgan permisos nuevos.

| GET | Permisos equivalentes existentes | Resultado |
|---|---|---|
| `/insights/rules/catalog` | Identidad institucional activa; filtra por permisos de cada reporte | Catálogo autorizado |
| `/insights/me/activities` | `reports.read_own`, `assignments.read_own` | Tareas propias pendientes |
| `/insights/monitor/assignments` | `reports.read_assigned`, `submissions.read_assigned` y asignación docente real | Revisiones pendientes |
| `/insights/institution/courses` | `reports.read_institution_aggregates` | Cursos sin lecciones publicadas aplicables |
| `/insights/{me,monitor,institution}/{practices,assessments,competencies}` | Permiso Reports del ámbito | Fuente no disponible |

La tabla usa llaves como abreviatura documental, no como URL literal.
No existen `/insights/me`, endpoints de revisión POST ni de recomendaciones.

Filtros estrictos: los de cada definición en `report_definitions.py`; `page >= 1`,
`page_size` 1–100. Monitor exige aula y curso; periodo opcional validado contra
su ámbito. Se rechazan filtros duplicados, desconocidos o no soportados por fuente.
No se admite `institution_id`, identidad estudiantil libre, SQL o reglas del cliente.

Respuesta: `metadata` de Reports, `items`, `page`, `page_size`, `source_total`,
`data_status`, `limitations`. `source_total` cuenta filas fuente, no sugerencias.
Una página sin condiciones puede tener `items=[]` y total fuente positivo.
Solo se incluyen referencias de tarea/curso, no respuestas o nombres.

Headers `private, no-store`, Vary Authorization/Cookie y nosniff.
Errores usan excepciones del backend existente: autenticación/permiso, validación,
404 fuente desconocida y 503 SQL/auditoría. Los endpoints no tienen pruebas HTTP
ejecutadas todavía; el código no acredita autorización integral verificada.
