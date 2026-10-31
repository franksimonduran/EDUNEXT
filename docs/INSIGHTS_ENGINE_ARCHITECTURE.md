# EDUNEXT Insights — implementación parcial, 2026-10-26

Motor de consulta descriptiva dentro de FastAPI existente. Flujo:
sesión/RBAC → InsightsService → ReportService → repositorios y servicios previos
→ snapshot PostgreSQL de Reports → reglas backend → explicación de estado.
No hay motor generativo, predicción, diagnóstico, cambio de notas o AD/A/B/C.

`app/rules/insight_rules.py` contiene tres reglas inmutables v1. No interpreta código
del cliente. `app/services/insights_service.py` reutiliza permisos, identidad,
validación de filtros, matrícula/asignación y consultas de Reports. No duplica SQL.
`app/api/v1/endpoints/insights.py` reutiliza la transacción REPEATABLE READ y timeout
de Reports. El commit conserva su evento de acceso antes de responder.

No hay modelos ni migraciones nuevos: resultados calculados en cada consulta,
sin materialización. Un ID SHA-256 identifica contexto/valor de snapshot; no concede
acceso, no equivale a idempotencia de escritura ni identifica una revisión persistida.

No se habilitan revisiones humanas persistentes, recomendaciones de recursos ni
acciones docentes. No hay pantallas conectadas. El cliente JS reutiliza auth/Fetch,
no almacena tokens ni datos privados. Las experiencias demo existentes se conservan.

Fuentes bloqueadas devuelven `source_unavailable`, nunca conteos cero inventados.
Fase 44 parcial y uso real NO-GO hasta pruebas de integración/seguridad.
