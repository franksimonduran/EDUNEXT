# Resultados reales — continuación Fase 44

Trabajo local 2026-10-26; evidencia final fechada 2026-10-27 UTC.
Windows, Python 3.11 del usuario, Node existente. Sin instalación de dependencias.

## Ejecutado

- Cinco tests unittest aprobados del motor de reglas sintéticas, incluidos subcasos
  de datos incompletos, código/SQL como cadenas, booleanos y conteos inválidos.
- Análisis AST de archivos Python nuevos/modificados: aprobado.
- Sintaxis ES module del cliente JS: aprobada.
- Reejecución final con `AITHRON_FINAL_VALIDATION=1`: exit 0 de reglas y JS.
- Hashes SHA-256 posteriores a correcciones guardados con la evidencia final.

Evidencia: `docs/final/evidence/insights-20261027T022101966067Z.json`.
Reproducción desde raíz:

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
python tools/validate-insights.py
```

El runner usa solo biblioteca estándar para tests/sintaxis Python y Node para JS;
crea evidencia nueva, no sobrescribe baseline ni regenera inventario congelado.

## Incidencias durante la ejecución

Primera ejecución unittest bloqueada: importar el paquete services activaba imports
SQLAlchemy, ausente. Se trasladó el motor puro a `app/rules`; reejecución aprobada.
Primera comprobación AST no toleraba BOM preexistente en router; lectura corregida
a utf-8-sig. Primera redirección JS con `<` no era válida en PowerShell; se repitió
mediante pipeline y luego subprocess en el runner. No fueron fallos de negocio.

## No ejecutado / bloqueado

pytest y SQLAlchemy no disponibles en los intérpretes revisados. Sin import runtime
de FastAPI, OpenAPI, HTTP, login, sesión revocada, RBAC/IDOR/BOLA, dos instituciones,
PostgreSQL, integridad de auditoría, snapshots concurrentes, pruebas de recursos,
revisión humana persistente, migraciones, navegador, offline o regresión completa.
No hay mediciones de latencia SQL, memoria o volumen real. Los 0.000s mostrados por
unittest no son un benchmark. No se conectó ni modificó ninguna base de datos.

## Archivos

Creados:
- `backend/app/rules/insight_rules.py`
- `backend/app/services/insights_service.py`
- `backend/app/api/v1/endpoints/insights.py`
- `backend/verification/test_insight_rules.py`
- `frontend/js/services/insights-api.service.js`
- `tools/validate-insights.py`
- `docs/INSIGHTS_ENGINE_ARCHITECTURE.md`
- `docs/INSIGHTS_API.md`
- `docs/INSIGHTS_RULE_CATALOG.md`
- `docs/INSIGHTS_EXPLANATION_MODEL.md`
- `docs/INSIGHTS_DATA_SOURCES.md`
- `docs/INSIGHTS_RECOMMENDATIONS.md`
- `docs/INSIGHTS_TEACHER_WORKFLOW.md`
- `docs/INSIGHTS_PRIVACY_AND_SECURITY.md`
- `docs/INSIGHTS_OFFLINE_CONTRACTS.md`
- `docs/INSIGHTS_FRONTEND_INTEGRATION.md`
- `docs/INSIGHTS_STUDENT_EXPERIENCE.md`
- `docs/INSIGHTS_INSTITUTIONAL_ANALYTICS.md`
- `docs/INSIGHTS_KNOWN_LIMITATIONS.md`
- `docs/INSIGHTS_TEST_RESULTS.md`
- Evidencia JSON citada arriba.

Modificado: `backend/app/api/v1/router.py` para registrar Insights.
No se alteraron cambios previos de Fase 40, datos, migraciones o SW.
No hay repositorio `.git` identificado ni Git disponible en PATH: no se puede
certificar rama/diff frente a un commit. El listado corresponde a esta intervención.

## Aceptación

**Parcialmente implementada, no aceptada para uso real.** Las pruebas de reglas
no acreditan API/persistencia ni seguridad integral. Producción y piloto NO-GO.
Se detiene para revisión; no se inicia Fase 45.
