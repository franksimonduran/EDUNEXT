# Catálogo de reglas v1

| Código | Reporte / métrica | Condición | Acción opcional |
|---|---|---|---|
| `tasks.pending` | `me.activities` / `pending_count` | entero > 0 | Consultar tarea |
| `tasks.review_pending` | `monitor.assignments` / `review_pending_count` | entero > 0 | Abrir entregas para revisar |
| `content.no_published_lessons` | `institution.courses` / `published_applicable_lessons_count` | entero = 0 | Revisar flujo editorial |

Todos los umbrales son comprobaciones operativas de existencia, no umbrales
pedagógicos ni criterios MINEDU. No hay configuración editable ni código dinámico.
Las métricas y poblaciones conservan la definición de Fase 43. `pending_count`
incluye revisiones solicitadas y no equivale necesariamente a nunca haber entregado.

Conteos negativos, booleanos, ausentes, cadenas y decimales generan
`insufficient_data`, sin sugerencia. Una condición no cumplida no crea tarjeta.
Cada regla publica versión 1; cambios semánticos futuros requieren incrementar
versión y probar compatibilidad. El catálogo no tiene historial persistente todavía.

Pruebas: `backend/verification/test_insight_rules.py`; cubren condiciones, límites,
reproducibilidad, entradas inválidas e identidad contextual. No prueban PostgreSQL.
