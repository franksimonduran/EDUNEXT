# PostgreSQL, migraciones e integridad

Sin conexión a PostgreSQL. No se conoce versión viva, rol/privilegios, tablas reales, heads aplicados, restricciones efectivas, backups ni estado de conexiones. El inventario Fase 47 localiza 11 migraciones; no se ejecutó Alembic upgrade/downgrade/current.

Engine usa sessionmakers con cierre en finally; pool no-test: size 5, overflow 10, timeout 30, recycle 3600, pre_ping; tests NullPool. No se ajustó capacidad sin medidas. SQL echo se deshabilitó para no imprimir parámetros privados.

Refresh ahora usa SELECT FOR UPDATE; validar en PostgreSQL carrera/rotación/replay/logout. Las pruebas backend existentes recrean esquema y conservan guard explícito Fase 47; **no se ejecutaron** por prohibición de borrar tablas y ausencia de entorno aislado operativo. No se activa ese opt-in durante esta auditoría.

No se cambiaron migraciones, relaciones, registros académicos o AD/A/B/C. Evaluaciones/competencias completas no pueden aprobarse con módulos previos incompletos. Integridad histórica, traslados, rectificaciones, entregas duplicadas y logros requieren pruebas reales. La prueba escrita con mocks de curso ajeno no demuestra restricciones relacionales ni aislamiento real.
