# Fase 37 - organización académica

## Alcance implementado

La Fase 37 incorpora la API de organización académica sobre FastAPI, SQLAlchemy 2 y PostgreSQL. Todas las operaciones de institución validan el `institution_id` del contexto autenticado; un recurso de otra institución responde `404` y una operación sin permiso responde `403`.

### Estructura académica

| Recurso | Endpoints | Permisos |
|---|---|---|
| Años académicos | `GET/POST /academic-years`, `GET/PATCH /academic-years/{id}` | `academic_years.read`, `academic_years.manage` |
| Periodos | `GET/POST /academic-periods`, `GET/PATCH /academic-periods/{id}` | `academic_periods.read`, `academic_periods.manage` |
| Grados | `GET /grades`, `GET /grades/{id}` | `grades.read` |
| Secciones | `GET/POST /sections`, `GET/PATCH /sections/{id}` | `sections.read`, `sections.manage` |

Los grados base 4.º, 5.º y 6.º de primaria se siembran al iniciar la aplicación y en la preparación de pruebas mediante `app.services.academic_seed.ensure_default_grades`.

Los estados de años y periodos son `draft`, `planned`, `active`, `closed` y `archived`. Las transiciones permitidas son `draft -> planned/active/archived`, `planned -> active/closed/archived`, `active -> closed` y `closed -> archived`. Solo puede existir un año activo por institución y un periodo activo por año.

### Aulas

| Endpoint | Uso |
|---|---|
| `GET/POST /classrooms` | Listado paginado y creación |
| `GET/PATCH /classrooms/{id}` | Detalle con estudiantes y asignaciones, y edición |
| `POST /classrooms/{id}/archive` | Archivo lógico |
| `GET /classrooms/{id}/students` | Estudiantes con matrícula vigente o suspendida |
| `GET /monitors/me/classrooms` | Aulas asignadas al monitor autenticado |

El administrador usa `classrooms.read_institution` y `classrooms.manage_institution`; el monitor usa `classrooms.read_assigned`. La creación valida que el año esté abierto, que el grado esté activo y que la sección pertenezca al grado. Un aula con matrículas pendientes/activas o asignaciones activas no se puede archivar.

### Matrículas y movimientos

| Endpoint | Uso |
|---|---|
| `GET/POST /enrollments` | Listado paginado y creación |
| `GET/PATCH /enrollments/{id}` | Detalle con historial y edición de periodo/fecha |
| `POST /enrollments/{id}/withdraw` | Retiro |
| `POST /enrollments/{id}/complete` | Culminación |
| `POST /enrollments/{id}/transfer` | Traslado de aula |
| `GET /academic-movements` | Historial académico filtrable |

Reglas aplicadas:

- Un estudiante solo puede tener una matrícula `pending` o `active` por año académico.
- El cupo se valida con bloqueo `SELECT ... FOR UPDATE` sobre el aula; el índice parcial único `uq_enrollment_active_student_year` protege la regla ante concurrencia.
- Un traslado exige otra aula de la misma institución, año y grado. No cambia de año ni de grado.
- Retiro y culminación cierran la matrícula con fecha efectiva, motivo y un registro inmutable en `academic_movements`.
- Tras un retiro se puede crear una nueva matrícula en el mismo año, conservando el historial anterior.
- El monitor solo ve matrículas de sus aulas asignadas; el estudiante solo ve sus propias matrículas.

La creación y el traslado aceptan `Idempotency-Key`. El resultado se reutiliza durante 24 horas para la misma institución, usuario, operación y clave. Reutilizar la clave con un cuerpo distinto responde `409`. La huella se calcula con SHA-256 sobre el JSON canónico.

### Asignaciones docentes

| Endpoint | Uso |
|---|---|
| `GET/POST /teacher-assignments` | Listado paginado y creación |
| `GET/PATCH /teacher-assignments/{id}` | Detalle y edición |
| `POST /teacher-assignments/{id}/revoke` | Revocación lógica |

El administrador administra asignaciones con `teacher_assignments.manage_institution`; el monitor consulta las propias con `teacher_assignments.read_own`. La asignación valida institución, monitor activo, aula activa, curso activo del mismo grado y periodo del mismo año. Los estados son `planned`, `active`, `completed`, `revoked` y `cancelled`; la revocación conserva el registro histórico.

## Migración

La revisión `phase37academic` depende de `5f0581f9d75b` y realiza:

- alta de `enrollments.academic_year_id` con relleno desde `classrooms.academic_year_id`;
- ampliación del enum `enrollmentstatus` con `completed` y `cancelled`;
- índice parcial único de matrícula activa por estudiante y año;
- eliminación de la unicidad histórica `(student_id, classroom_id, period_id)` para permitir reingresos;
- unicidad de aula por `(institution_id, academic_year_id, grade_id, section_id)`;
- creación de `academic_movements` y `academic_idempotency_records`.

La migración se verificó con `alembic upgrade head`, `alembic downgrade 5f0581f9d75b` y un nuevo `upgrade head` sobre una base temporal PostgreSQL.

## Cliente frontend

`frontend/js/services/academic-organization.service.js` expone funciones para años, periodos, grados, secciones, aulas, matrículas, movimientos y asignaciones. Reutiliza `apiRequest` de `auth.service.js`, que conserva el token en memoria y `sessionStorage`, renueva sesiones ante `401` y añade el encabezado CSRF en mutaciones.

Las pantallas administrativas existentes todavía consumen los servicios de demostración de fases anteriores. La conexión visual de esas pantallas al nuevo contrato queda pendiente y no debe considerarse completada por este documento.

## Verificación

```powershell
cd backend
python -m pytest -q
```

Resultado de la fase: `38 passed`. Incluye pruebas de estructura, aislamiento entre instituciones, cupo, idempotencia, traslados, retiros, culminación, reingreso, archivado y visibilidad por rol.

## Pendiente

- Conectar las pantallas `matriculas.html`, `aulas.html`, `aula-detalle.html`, `asignaciones-docentes.html`, `periodos-academicos.html` y `movimientos-academicos.html` al cliente API.
- Proceso formal de promoción entre años y grados, con generación masiva de matrículas.
- Edición/desactivación de grados desde API y scoping institucional de secciones si el modelo de datos lo requiere.
- Limpieza programada de claves de idempotencia expiradas.
- Pruebas de concurrencia real con múltiples conexiones y prueba visual de las pantallas conectadas.
