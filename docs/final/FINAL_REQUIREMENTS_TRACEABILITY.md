# Trazabilidad y alcance de evidencia

Fuente normativa interna de esta entrega: 50 estados en FINAL_PHASE_STATUS.json y 28 requisitos funcionales en FINAL_ACCEPTANCE_CASES.json. Cada caso identifica pantalla, código/servicio, ruta existente a contrastar (o ausencia), esperado, severidad/prioridad, resultado y defecto. Matriz legible en [aceptación](FINAL_ACCEPTANCE_MATRIX.md).

Código/modelos/esquemas/permisos/migraciones/páginas/CSS/JS/recursos/pruebas/workflows: FINAL_INVENTORY.json (declaraciones estáticas, no DB/OpenAPI vivo). Los nombres de tabla/permiso no prueban filtros o relaciones. La vinculación completa de schema/modelo/permiso por acción queda pendiente de runtime; no se inventa para rellenar columnas.

| Evidencia técnica | Qué demuestra | Qué NO demuestra |
|---|---|---|
| NODE_REGRESSION.json | Contratos/transporte/VM, error y sesión simulada; HTTP loopback sintético | Revocación o persistencia real PostgreSQL |
| INFRA_CONTRACTS.json | Fuente/JSON/guardas y helper smoke con fixture | YAML ejecutado, Docker/HTTPS/staging/restore |
| BROWSER_VALIDATION.json | Renders demo/login en Edge/Chrome, anchos/foco acotados | Permisos, estudio con personas, aprendizaje o E2E autenticado |
| HANDOVER_ACCEPTANCE.json | Catálogo/paths/estados/fixtures y enlaces realmente comprobados | Aceptación institucional/pedagógica o todos los comandos backend |
| FINAL_TEST_RUN.json | Salidas/tiempos de suites ejecutadas en este entorno | SLA/porcentaje global de producto o aprobación automática |

Si un artefacto falta o su salida no es satisfactoria, se registra no ejecutado/fallido/bloqueado según causa; no se atribuyen resultados de fases previas a esta ejecución. Responsable de aceptación de cada requisito: por designar.
