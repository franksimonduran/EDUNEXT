# Integración frontend real de FASE 41

Se amplió `frontend/js/student/progress.js` sobre la pantalla existente
`student/progreso.html`. Conserva shell, CSS y barra de progreso accesible existentes.

- `?grade=4&modo=api`: modo explícito FastAPI.
- `?grade=4&modo=demo`: conserva demostración local.
- Sin modo explícito, presencia de token de sesión existente selecciona API.
- La autenticación se reutiliza mediante `auth.service.js` y Fetch API.

Se muestran cursos, denominadores, porcentajes textuales, estados sin contenido,
finalizaciones autodeclaradas y reconocimientos. Las otras fuentes se identifican
como no disponibles. No se generan fortalezas/diagnósticos a partir del porcentaje
real; esos datos demo no se mezclan con los confirmados.

"Marcar como revisada" solo aparece con capacidad devuelta por el servidor. Envía
ID de lección/versión, espera confirmación y recarga datos. No afirma dominio.
Los errores no provocan fallback demo silencioso. El texto publicado se escapa.

Cliente nuevo: `frontend/js/services/progress-api.service.js`. También expone
historial y consulta docente; todavía no están conectados a pantallas específicas.
No se conectaron dashboard Monitor/Administrador ni la vista de lección previa.

Prueba de navegador ejecutada con API simulada; prueba backend real PostgreSQL
separada. No se ejecutó recorrido E2E con login real + PostgreSQL + navegador.
