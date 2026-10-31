# End-to-end final

No se ejecutaron cadenas autenticadas completas: login→sesión→DB→dashboard, matrícula/cursos/lección/progreso, práctica/respuestas/resultado, evaluación/revisión/publicación, tarea/entrega/feedback, contenido/editorial o aislamiento A/B. R01–R26 mantienen bloqueos/excepciones según matriz; no se aprueban con mocks.

Sí hay prueba de navegador real **público/demo** de login y vistas estudiante, catálogo, lección, monitor y admin; no credenciales válidas, acceso real o persistencia institucional. Dos instituciones y seis estudiantes en fixture son descripciones no sembradas. No confundir datos locales ficticios con PostgreSQL o piloto.

Python/FastAPI/PG/Alembic y entorno integrado siguen sin operación local verificada; CI preparado no prueba haber corrido. Artefactos de final/evidence describen ámbito exacto y salidas. No suites E2E decorativas o deshabilitadas para verde.
