# Resultados reales FASE 41

## Continuación verificada — 2026-10-23

- `python -m pytest verification --confcutdir=verification -q`: **44 passed,
  1 warning in 5.92s**. Incluye suites de fundamentos de evaluación, progreso y
  planner ya presentes. Warning: deprecación de versión argon2 en passlib.
- `node tests/phase41.cjs`: **PASS**. Navegador con API simulada; no E2E PostgreSQL.
- `python -m alembic current`: **phase41progress**. No se aplicaron migraciones
  nuevas en esta continuación; el escenario aislado ejecuta la migración existente.
- Nuevas aserciones: borrador con publicación antigua excluido y escritura
  rechazada, versión completada conservada tras nueva publicación, fechas reales,
  contrato tipado de unidad, catálogos `/achievements` y `/badges`, filtros sin zona
  horaria y tamaño de página excesivo rechazados con 422.

La carpeta entregada no contiene `.git`: `git status --short --branch` devolvió
«not a git repository». No se pudo obtener rama ni diff contra una base Git.
No se ejecutó la suite legacy completa ni pruebas concurrentes de sesiones
independientes. Los resultados históricos siguientes se conservan como antecedente.

Fecha: 2026-10-23. Windows, Python 3.11, PostgreSQL local configurado, asyncpg,
SQLAlchemy, pytest y Chromium/Playwright disponible en el entorno.

## Ejecutado

```powershell
# Desde backend/
python -m pytest verification --confcutdir=verification -q
python -m alembic upgrade head
python -m alembic current
# Desde raíz
node tests/phase41.cjs
node tests/phase37.cjs
node --check frontend/js/student/progress.js
node --check frontend/js/services/progress-api.service.js
```

Resultado después de ampliar el escenario de versiones:
**33 passed, 1 warning in 4.00s** (deprecación heredada argon2). Incluye 26 comprobaciones
de fundamentos FASE 40 y 7 casos FASE 41 (cinco parámetros matemáticos, referencia
de catálogo y escenario integral PostgreSQL/API con numerosas aserciones).

El escenario usa esquema único creado dentro de una transacción y rollback final;
no elimina tablas ni datos existentes, ni utiliza el fixture legacy drop_all.
Ejecuta la migración real FASE 41 en el esquema aislado después de crear las tablas
previas. Verifica hechos/reconocimientos, curso de unidades desiguales, historial,
versión obsoleta, borrador, validación fallida, institución ajena, permiso, docente,
supresión de cohortes pequeñas, rollback y contratos HTTP con contexto autenticado
inyectado. No es una prueba de login JWT completo.

Migración normal aplicada: `21d890e192ab -> phase41progress`; current confirmó
`phase41progress (head)`. Solo tabla de reconocimientos y dos permisos sin grants.

Playwright FASE 41: **PASS**, API simulada; declaración y confirmación, recarga,
escape de script, móvil, 403 sin fallback y demo. Primer intento falló por mensaje
de error genérico del shell; se implementó estado explícito en la pantalla y pasó.
Playwright FASE 37: **PASS**, regresión de matrículas. Sintaxis JS: ambos comandos
finalizaron sin error.

## No ejecutado / bloqueado

Concurrencia real de dos sesiones; fuente de prácticas/juegos confirmados;
competencias/valoraciones confirmadas; rectificaciones; login/sesión revocada;
grupos agregados de cinco o más; E2E de navegador contra API/BD reales;
actualización offline/cambio de usuario; regresión completa 33–40.

No se interpretan las pruebas anteriores como aceptación integral de la fase.
