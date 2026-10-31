# Regresión y resultados medidos

Comando final: `node tools/run-final-validation.cjs`. Artefactos nuevos: NODE_REGRESSION.json, INFRA_CONTRACTS.json, BROWSER_VALIDATION.json, HANDOVER_ACCEPTANCE.json y FINAL_TEST_RUN.json. Los logs originales 48/49 se conservan cuando se usa AITHRON_FINAL_VALIDATION=1.

Alcance: cuatro suites Node anteriores (contratos, sesión, VM SW y HTTP loopback), diez contratos infra, navegador ampliado y siete comprobaciones de catálogo/documentos/fixtures/trazabilidad/gates. Los checks de fuente y demos nunca sustituyen E2E crítico. Consultar exitCode/status de cada ejecución; si falla/bloquea no se declara aprobado.

No ejecutados: Python/DB/migraciones reales, Docker/Compose/nginx/CI cloud/TLS/backup/restore, proveedores reales, Sync confirmado, carga/soak/EXPLAIN, pruebas humanas/pedagógicas o aceptación institucional. Sin tests eliminados ni auth debilitada.

Rendimiento: Navigation Timing por muestra de login/demo local en navegador, sin throttling; no LCP/INP/CLS, p95 de API, consumo CPU/memoria sostenido o SLA. Duración de suites es wall time de tests, no latencia de plataforma. No hay comparación estadística de regresión/capacidad; no prometer mejora por muestras rápidas.
