# Fase 47 — arquitectura y alcance real

> Actualización: [continuación 2026-10-27](PHASE_47_CONTINUATION_2026-10-27.md).
> Se conservan abajo las observaciones históricas. Actualmente se registran
> Insights y Sync parciales; OpenAPI/imports y pruebas ASGI ya se ejecutaron sin BD.
> Esto no cambia la decisión NO-GO ni certifica flujos completos.

Estado: parcial; aceptación bloqueada. Fecha: 2026-10-23.

Se conserva HTML/CSS/ES6, FastAPI, SQLAlchemy 2, Alembic y PostgreSQL. No se reconstruyen evaluaciones, Insights o Sync ausentes. No se ejecutó Fase 48 ni despliegue.

## Autoridad

PostgreSQL es autoritativo para registros confirmados; FastAPI aplica reglas y RBAC. JavaScript presenta datos. IndexedDB conserva propuestas locales, no certifica entregas ni notas. Service Worker conserva recursos, no confirma operaciones.

## Componentes encontrados

- `backend/app/main.py`: lifespan con semillas de roles/grados, worker de retención AI, CORS, middleware y router v1.
- `backend/app/api/v1/router.py`: autenticación, personas, organización, contenidos, prácticas/juegos, progreso, planner, reportes y AI. No registra Insights ni Sync.
- `frontend/js/services/auth.service.js`: cliente HTTP compartido, bearer, cookie refresh, CSRF, recuperación de sesión.
- `frontend/sw.js`: cachés static/content y fallback offline; no es un protocolo de push/pull confirmado.
- `docs/INTEGRATION_SOURCE_INVENTORY.json`: archivos y referencias extraídos, no evidencia runtime.

## Cambios acotados

Refresh single-flight por contexto JavaScript; login no fabrica sesión cuando falla `/auth/me`; errores diferenciados; timeout de recepción de cabeceras y cancelación; metadatos de validación/reintento; protección previa a pruebas destructivas. No se agregaron modelos, migraciones ni otra base.

Inventarios estáticos regenerables con `node tools/audit-phase47.cjs`. La extracción por expresiones regulares no sustituye OpenAPI ni inspección de dependencias por endpoint.
