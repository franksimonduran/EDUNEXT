# Resultados reales — 2026-10-23

> Estos resultados se conservan como históricos. Nueva ejecución acotada
> 2026-10-27: **67 passed, 1 skipped, 35 subtests passed**; suites JS seleccionadas
> y navegador público/demo Chrome/Edge pasan. No PostgreSQL ni E2E autenticado.
> Evidencia nueva y alcance exacto en `PHASE_47_CONTINUATION_2026-10-27.md`.

| Comando / comprobación | Resultado | Alcance |
|---|---|---|
| git status --short --branch | Bloqueado: git no reconocido | No se conoce rama, modificaciones ni archivos sin seguimiento Git |
| python --version | Falló: alias Microsoft Store | No hay Python operativo localizado en PATH |
| Get-Command python,node,docker | Node disponible; Docker ausente; python alias | No acredita servicios PostgreSQL |
| node tools/audit-phase47.cjs | PASS: 176 páginas, 258 decoradores, 11 migraciones | Análisis estático; no prueba montaje runtime |
| node tests/phase47-api.cjs | PASS | Transporte simulado, sin servidor ni BD |
| Test-Path .git | False | No hay metadatos Git en raíz |
| node --experimental-default-type=module --check (dos archivos JS) | Falló: opción no soportada por Node instalado | No es error de sintaxis; los módulos se importan en la prueba de contrato |

Prueba nueva cubre refresh single-flight (10 solicitudes), HTTP 400/401/403/404/409/422/429/500/503, detalle 422, Retry-After, red caída, timeout, rechazo de ruta // y fallo cerrado de login si /auth/me da 403.

No ejecutados: pytest, Alembic upgrade/current, arranque FastAPI, conexión PostgreSQL, seeds de integración, navegador E2E, regresiones previas, responsive, accesibilidad, multiinstitución, dispositivos/offline y proveedores reales. No se adjudican resultados históricos a esta ejecución. No se declara compatibilidad Chrome/Edge/Firefox/Safari.

El guard de pruebas backend fue revisado en fuente; no validado ejecutando Python. La base de prueba ni siquiera fue abierta por este trabajo.
