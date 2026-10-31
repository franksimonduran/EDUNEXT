# Rendimiento PostgreSQL

Revisión estática: pool size=5, max_overflow=10, timeout=30, recycle=3600, pre_ping en no-test; NullPool en tests. Dos engines sync/async existen; límite total debe considerar procesos y ambos pools. No se aumentó número de conexiones.

Consultas seleccionadas usan paginación y selectinload, pero no se midió N+1 ni se verificaron planes de los reportes. Conteos/historial/matrículas requieren datasets y comparación de resultados, no solo índices sugeridos por nombres.

No ejecutado EXPLAIN/ANALYZE, pg_stat*, pruebas de bloqueos/deadlocks, latencias, exportaciones grandes o refresh simultáneo. FOR UPDATE agregado al refresh es una corrección de integridad pendiente de medir, no una optimización certificada.

No hay índices/migraciones nuevos. Próximo paso seguro: entorno desechable sin datos reales, lectura de plan para endpoints críticos con filtros institucionales, medición de consultas y concurrencia limitada. Mantener privacidad/grupos pequeños y comparar conteos antes/después de cualquier optimización.
