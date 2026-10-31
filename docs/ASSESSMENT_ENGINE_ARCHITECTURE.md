# FASE 40 — Base técnica y auditoría

Fecha: 2026-10-23. Estado: **parcial; aplicación académica bloqueada por dependencias sin validar**.

## Estado observado

Existen `Assessment`, `AssessmentQuestion`, `AssessmentAttempt`, `AssessmentResponse`
y `AssessmentResult` en `backend/app/db/models/assessment.py`. Se conservaron esas
entidades sin duplicarlas ni modificar datos históricos.

Todavía no hay routers de evaluaciones académicas que implementen el contrato de
FASE 40. Los routers registrados de prácticas no constituyen una API académica.
Que el proceso importe o pasen las regresiones de FASE 37 no valida publicación,
entrega, corrección o registro académico.

El README describe las pantallas de evaluaciones y notas como demostración. Se
comprobó que `monitor-evaluations.service.js` sigue usando IndexedDB, identidades
demo y `apiCapability().available=false`. `evaluation.service.js` tampoco es un
cliente de FastAPI. No se realizó migración automática de esos datos.

No se encontraron `PROJECT_STRUCTURE` ni `AGENTS.md` en la búsqueda del proyecto.
`git status --short --branch` informó que esta carpeta no es un repositorio Git.

## Componentes añadidos

- `repositories/academic_access_repository.py`: consulta de matrícula por identidad,
  institución, aula, grado, año activo, vigencia y oferta docente activa del curso;
  consulta separada de asignación docente por perfil real, curso y aula.
- `services/academic_access_service.py`: resolución de perfil estudiantil activo,
  comprobación de propietario, matrícula y permiso más asignación docente.
- `schemas/assessment.py`: entradas estrictas, presentación de pregunta mediante
  lista de campos permitidos y contrato separado de juicio docente con evidencias.
- `services/assessment_scoring_service.py`: corrector numérico decimal y agregación
  que distingue preguntas revisadas y pendientes; no asigna niveles de competencia.
- `verification/test_assessment_foundations.py`: pruebas focalizadas sin recrear BD.

La comprobación de propietario se integró en guardado, entrega y cancelación de
intentos formativos. El inicio utiliza ahora la consulta real de matrícula en lugar
de un método que siempre devolvía `None`. Esto no certifica el resto de FASE 39.

## Contratos y decisiones

`AssessmentAnswer` solo acepta `answer_data` y `expected_revision`. La revisión
esperada es un contrato: aún no existe un endpoint académico que aplique esa
precondición contra PostgreSQL. No se debe presentar como concurrencia resuelta.

`StudentQuestion` permite ID, tipo, enunciado y opciones con ID/texto. El adaptador
descarta claves correctas y metadatos de opciones. No se ha conectado a una ruta.

`CompetencyJudgmentInput` exige nivel explícito AD/A/B/C, evidencias únicas,
justificación, competencia y periodo. No acepta puntuaciones. La integridad de
las referencias y la responsabilidad docente deben verificarse por servicio antes
de persistir. Este contrato no confirma ni comunica registros académicos.

## Scoring implementado

Solo se implementó y comprobó aquí el corrector numérico decimal: tolerancia
inclusiva, valores finitos, sin booleanos numéricos, coma decimal permitida y sin
separadores de miles. Un valor no válido produce error de validación.

Las respuestas abiertas pueden representarse como pendientes con puntuación
`None`, no cero. El resumen separa máximo del instrumento y máximo revisado; el
porcentaje mostrado corresponde exclusivamente al máximo revisado. No equivale
a un resultado final cuando hay pendientes. No se convierte a AD/A/B/C.

## Diseño pendiente para persistencia

Ampliar los modelos existentes mediante migración aditiva revisada: versión
inmutable, convocatoria por aula/periodo, referencia de versión en intento y
pregunta, revisión, evidencias privadas, rúbricas versionadas, valoraciones,
registros y rectificaciones. Antes de habilitarlo deben pasar pruebas de
autorización por recurso, unicidad de entrega, concurrencia y aislamiento.

No se añadieron tablas para funciones todavía no implementadas, ni permisos
concedidos automáticamente, ni endpoints que aparenten confirmar notas.
