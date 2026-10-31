# Rendimiento y límites

Entorno de medición: Windows, Python 3.11, PostgreSQL local, asyncpg, SQLAlchemy 2.
Datos ficticios: 6 destinatarios, 1 tarea, última versión por destinatario.

Medición observada al ejecutar
`python -m pytest verification/test_reports_engine.py --confcutdir=verification -q -s`:

`REPORT_PERFORMANCE recipients=6 tasks=1 rows=1 SQL=6 elapsed_ms=36.87`

Es una medición puntual del servicio bajo fixture, no benchmark de producción ni
latencia de red/HTTP. El test limita a 10 statements para detectar regresión N+1
del reporte docente de tareas. No se midió gran volumen ni concurrencia real.

## Diseño

- Conteos DISTINCT y agrupaciones dentro de PostgreSQL.
- Una consulta agrupada de últimos intentos para todas las tareas de una página.
- Catálogo publicado compartido como statement; conteos de contenido en SQL.
- Paginación 25 predeterminada, máximo 100; exportación síncrona máximo 100 filas.
- Serie temporal máxima 366 días; no se permite SQL/filtros libres.
- Transacción REPEATABLE READ y statement_timeout 10 segundos por sesión de reportes.
- Índices académicos existentes institución/año, aula/estado y únicos target/intento.
- Nuevo índice de auditoría institución/created_at. No se añaden índices académicos
  sin medición que los justifique ni se introduce infraestructura BI/colas externas.

El resumen personal reutiliza servicios anteriores; su eficiencia sobre catálogos
muy grandes no está certificada. No se ejecutaron EXPLAIN ANALYZE ni pruebas de
memoria a escala. Si se justifica materializar, habrá que definir invalidación,
fecha de actualización, ámbito y pruebas de coherencia antes de activarlo.
