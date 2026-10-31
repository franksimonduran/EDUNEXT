# FASE 40 — Resultados reales de verificación

Fecha: 2026-10-23. Windows, Python 3.11, pytest, SQLAlchemy/asyncpg, PostgreSQL local
configurado por el backend. No se publican credenciales ni datos de usuarios.

## Comando focalizado

Desde `backend/`:

```powershell
python -m pytest verification/test_assessment_foundations.py --confcutdir=verification -q
```

Resultado inicial: **26 passed**. Son comprobaciones de fundamentos, no un flujo
de evaluación completo. Incluyen campos privilegiados rechazados, booleanos
estrictos, decimales finitos, tolerancia, denominadores con revisión pendiente,
filtrado de soluciones, contratos de juicio docente, propietario ausente/ajeno,
estructura SQL de aislamiento y ejecución PostgreSQL de solo lectura.

Reejecución después de ajustar las fechas académicas a la zona horaria de la
institución: **26 passed in 0.96s**.

El caso PostgreSQL usa `SET TRANSACTION READ ONLY`, `SELECT 1` y una consulta con
UUID aleatorios inexistentes; no prueba casos positivos de matrícula ni toda la
matriz multiinstitucional. No crea usuarios ni modifica tablas o registros.

La carpeta `verification` permite ejecutar sin el `conftest.py` previo, que
recrea el esquema de la BD de pruebas. No se ejecutó esa recreación aquí.

## Comprobaciones adicionales

- `python -m alembic current`: **21d890e192ab (head)**; conexión PostgreSQL correcta.
  No se crearon ni aplicaron migraciones de FASE 40.
- Import de FastAPI y generación de OpenAPI: ejecutados, 129 rutas en OpenAPI.
  Advertencias heredadas: Operation IDs duplicados para recursos de lección.
- Consulta inicial `/api/v1/health`: 404; esa ruta no existe. Las rutas reales
  son `/api/v1/health/live` y `/api/v1/health/ready`.
- `/api/v1/health/live`: **200**, cuerpo `status=alive`, comprobado con TestClient.
  Esto no sustituye una comprobación completa del lifespan/login.

## No ejecutado / pendiente

Login y sesión revocada; flujo de publicación académica; programación; intentos
académicos persistentes; revisión docente; evidencia; rúbricas; niveles y
registros; rectificación; concurrencia; idempotencia; migraciones nuevas; pruebas
E2E; integración frontend; entrega offline; regresión completa 33–39.

Los 38 tests y el Playwright de FASE 37 reportados en intervenciones anteriores
no son pruebas de aceptación de FASE 40. No se declaran como una ejecución nueva.
