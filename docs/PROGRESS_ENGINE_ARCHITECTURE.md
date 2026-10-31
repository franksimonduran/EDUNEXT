# AITHRON Progress Engine — FASE 41

Fecha: 2026-10-23. Estado: **parcial; fuentes académicas/formativas bloqueadas**.

## Fuentes auditadas

Se reutilizan identidad/sesión/RBAC, StudentProfile, matrícula, aula, año, grado,
asignación docente, Course/Unit/Lesson, ContentVersion/ContentReview/ContentPublication
y `LearningProgress`. Las fuentes de prácticas/juegos de FASE 39 no tienen aún
integridad y privacidad suficientes para presentar resultados confirmados. FASE 40
no persiste competencias ni registros académicos confirmados. Esas cuatro fuentes
responden `not_available` con motivo; no responden cifras demo ni ceros inventados.

No se encontraron `AGENTS.md` ni `PROJECT_STRUCTURE*` mediante búsqueda del proyecto.
`git status --short --branch` informó que la carpeta no pertenece a un repositorio Git.
Se inspeccionaron README, modelos, permisos, sesiones, migraciones, servicios de
progreso frontend y Service Worker existente.

## Capas reales

- Router: `app/api/v1/endpoints/progress.py`.
- Contratos: `app/schemas/progress.py`.
- Consultas: `app/repositories/progress_repository.py`.
- Reglas y transacciones: `app/services/progress_service.py`.
- Cálculo: `app/services/progress_calculator.py`.
- Seguimiento: `app/services/monitor_progress_service.py`.
- Agregados: `app/services/progress_aggregation_service.py`.
- Autorización reutilizada: `AcademicAccessService`, dependencias RBAC de FASE 35.

`LearningProgress` representa el hecho de inicio/finalización; no se crearon copias
de estudiantes, cursos, intentos, evaluaciones o notas. Los porcentajes se calculan
al consultar. La tabla nueva `student_achievements` conserva reconocimientos con
referencia al hecho que los originó. El catálogo de dos reglas es estático y versionado.

## Contexto persistido

Cada hecho nuevo tiene `metadata_.origin=progress-engine-v1`, institución,
curso, matrícula inicial, versión inicial, versión de finalización y matrícula de
finalización. El uso de JSON conserva el esquema anterior; estas referencias no
tienen todavía claves foráneas compuestas adicionales. Un registro legacy en la
misma pareja estudiante/lección causa 409 y no se sobrescribe.

Las columnas `course_id` y `unit_id` de LearningProgress se dejan nulas en hechos
por lección: sus restricciones únicas legacy impedirían guardar varias lecciones
de un curso si se rellenaran. El contexto reside en metadata. No se migraron filas
anteriores ni porcentajes demo automáticamente.

## Transacción

La escritura bloquea el perfil del estudiante, valida catálogo/matrícula, crea o
actualiza el hecho y concede reconocimientos en la misma transacción. El router
responde después del commit. La unicidad estudiante/lección y la de reconocimiento
refuerzan la repetición segura. Las lecturas no crean actividad ni reconocimientos.

El historial se deriva con UNION de inicio/finalización, filtros y paginación SQL;
no se creó una tabla de eventos redundante. Se conserva el contexto original al
consultar finalizaciones de contenido retirado.

Ver limitaciones de concurrencia, edición editorial y aceptación en
`PROGRESS_KNOWN_LIMITATIONS.md`.
