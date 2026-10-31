# Contrato HTTP de progreso

Autenticación Bearer y validación de sesión existentes. Los UUID de estudiante no
se aceptan como identidad en rutas propias. Respuestas correctas usan
`Cache-Control: private, no-store`; Service Worker existente excluye `/api/`.

| Método y ruta | Permiso | Resultado |
|---|---|---|
| GET `/api/v1/progress/me` | `progress.read_own` | resumen, cursos y disponibilidad por fuente |
| GET `/api/v1/progress/me/courses` | `progress.read_own` | Page con cursos, paginación SQL |
| GET `/api/v1/progress/courses/{id}` | `progress.read_own` | finalización del curso propio autorizado |
| GET `/api/v1/progress/units/{id}` | `progress.read_own` | unidad propia, porcentaje nullable |
| GET `/api/v1/progress/lessons/{id}` | `progress.read_own` | lección publicada aplicable y estado |
| POST `/api/v1/progress/lessons/{id}/start` | lectura propia + `progress.record_own_activity` | inicio idempotente, 200 |
| POST `/api/v1/progress/lessons/{id}/complete` | lectura propia + `progress.record_own_activity` | declaración de revisión registrada, 200 |
| GET `/api/v1/progress/me/history` | `progress.read_own` | Page de eventos reales |
| GET `/api/v1/progress/me/achievements` | `progress.read_own` | catálogo propio con estado earned/available |
| GET `/api/v1/badges` | `progress.read_own` | catálogo de reglas, sin datos privados |
| GET `/api/v1/progress/competencies` | `progress.read_own` | `not_available`; fuente de FASE 40 pendiente |
| GET `/api/v1/monitors/me/student-progress` | `progress.read_assigned` + asignación real | Page de conteos por estudiante autorizado |
| GET `/api/v1/progress/institution/summary` | `progress.read_institution_aggregates` | conteos con supresión de grupos pequeños |

No se duplicó una ruta `/achievements` equivalente a las rutas anteriores.

## Escritura

```json
{"lesson_version_id":"UUID de la versión publicada actual"}
```

No se aceptan otros campos: student_id, porcentaje, competencias o insignias
provocan 422. Versión obsoleta: 409. Registro legacy: 409. Lección inaccesible o
no publicada: 404. Permiso/perfil/matrícula insuficiente: 403. Sin sesión: 401.
Errores de DB no producen confirmación de éxito.

El permiso nuevo se cataloga mediante migración y **no se asigna automáticamente**.
El operador debe autorizar expresamente qué roles/usuarios pueden registrar
autodeclaraciones. La interfaz oculta esos botones si el servidor no concede esa
capacidad. No se crean permisos por editar datos del navegador.

## Lecturas

`page>=1`, `1<=page_size<=100`. El historial acepta `course_id`, `event_type`
(`lesson_started`/`lesson_completed`), `since`, `until` con offset horario.
Intervalo inválido o fecha sin zona: 422. Seguimiento requiere `classroom_id` y
`course_id`; `period_id` opcional exige coincidencia con la asignación docente.

La disponibilidad parcial de una fuente es un resultado explícito 200, no una
lista ficticia de valoraciones. No se confirma que una práctica o juego haya
terminado por existir una fila iniciada.
