# Línea base del sistema

## Continuación 2026-10-27

Se conservan los registros históricos inferiores. Línea base nueva antes de corregir
código de aplicación: `final/evidence/phase48-baseline-20261027T032140720870Z/RESULTS.json`;
12 checks fallidos y 3 aprobados en pruebas focales nuevas, no doce vulnerabilidades
independientes. Snapshot fuente inicial: 995 archivos, 459 candidatos sin valores.
Baseline incremental JWT posterior: `phase48-baseline-20261027T033145032968Z`,
4 fallos de claims y 30 tests aprobados antes de exigirlas.

Python 3.11 en venv propio, Node 24.22.1/Windows; no .git/Git operativo, no DB abierta,
sin .env privado. OpenAPI/ORM de Fase 47 ya disponibles (198 paths/63 tablas declaradas,
no esquema PG vivo). PROJECT_STRUCTURE, AGENTS, .github y Compose sí existen ahora.
Versiones resueltas y herramientas actualizadas se registran en evidencias SCA/integración.
No se mide inicio con lifespan ni migración aplicada; solo ASGI sin DB y funciones locales.

Resultados posteriores, comparación y límites en PHASE_48_CONTINUATION_2026-10-27.md.

## Registro histórico

Fecha local de trabajo: 2026-10-23; evidencias JSON usan UTC (ejecuciones posteriores a 2026-10-24T00:00Z). Windows x64, Node v24.22.1. Hardware consultado mediante os.cpus/os.totalmem en PHASE_48_BASELINE_EVIDENCE.json; no representa capacidad asignada ni consumo medido.

Git no reconocido; `.git` ausente. Rama/commit/diff no determinables. No se descartó trabajo previo. La identidad del código se registra por SHA-256 de fuentes en baseline y after. El baseline se tomó tras crear herramientas/prueba de auditoría, antes de corregir código de aplicación.

Fase 47: integración parcial, aceptación bloqueada. Inventario previo: 176 HTML, 258 decoradores, 11 migraciones. No se obtiene OpenAPI runtime aquí. README, configuración, routers, servicios/repositories seleccionados, auth, middleware, motor DB, SW, store demo y documentación previa revisados; no se afirma revisión manual exhaustiva de cada archivo.

## Ejecución inicial

- `git status --short --branch`: falla, ejecutable no disponible.
- `Get-Command git,python,py,node,docker`: Node disponible; Python alias WindowsApps; demás no localizados.
- `python --version`: falla; Python no instalado/operativo mediante ese comando.
- `node tests/phase47-api.cjs`: PASS inicial con transporte simulado.
- `node tools/audit-phase48.cjs baseline`: 945 fuentes, 449 coincidencias candidatas de patrones; **no 449 vulnerabilidades**.
- `node tests/phase48-security.cjs`: 4 fallos y 2 comprobaciones aprobadas antes de corregir SW.

Faltaban PROJECT_STRUCTURE.md, AGENTS.md, .gitignore, .github/, database/, content/, scripts/ raíz y Compose usuales. Hay backend/scripts, alembic y frontend/assets; no se duplicaron. `.gitignore` agregado después. No se encontró manifiesto PWA en la búsqueda inicial de frontend.

No medidos: arranque, migraciones actuales, servicios vivos, PostgreSQL, latencia real, memoria/CPU de app, navegadores. Dependencias declaradas sin entorno Python resuelto; no hay garantía de versiones instaladas. `.env` privado no leído ni expuesto.
