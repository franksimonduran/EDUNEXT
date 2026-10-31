# PostgreSQL de infraestructura

No se contrató PostgreSQL administrado ni se migraron datos. La plantilla de producción no es una conexión existente. Revisar región, residencia/transferencias, mantenimiento, PITR, exportabilidad, SLA, TLS/CA, límites de conexiones y costos con el proveedor elegido.

Local preparado: PostgreSQL 16 por digest, volumen persistente, sin puerto host, red interna. Bootstrap postgres solo crea roles locales en volumen NUEVO; API usa aithron_app sin superuser/createdb/createrole; aithron_migrator recibe CREATE en schema y ownership de objetos migrados. Default privileges conceden DML y uso de secuencias a app. No se ejecutó SQL ni certificaron permisos reales.

API/Alembic comparten política TLS en app/db/connection_options.py. verify-full usa SSLContext con hostname/certificación y CA explícita para asyncpg, y sslmode=verify-full/sslrootcert para psycopg2. Sin desactivar verificación para “hacer funcionar” producción. Pool original no aumentado: 5 + overflow 10 por engine/proceso; un worker inicialmente preparado, capacidad por medir.

Migración controlada: revisar heads y compatibilidad → confirmar backup/restauración verificables → probar misma imagen en staging → autorización específica → `python -m alembic current`, `python -m alembic heads`, `python -m alembic upgrade head` en entorno autorizado → verificar current/readiness/integridad. Esos comandos no se ejecutaron en producción ni aquí. Credenciales de migración separadas, sin superusuario permanente.

No downgrade automático ni borrado de restricciones. Expand/contract para cambios incompatibles y revisión de versiones anteriores antes de rollback. Readiness consulta DB y versión esperada; no certifica todos los módulos. Privilegios backup/maintenance son decisiones separadas pendientes; no incluir claves en URLs de comandos/logs.

Backups/drill y RPO/RTO: BACKUP_AND_RESTORE.md y DISASTER_RECOVERY.md. Persistencia, concurrencia, claves y restauración reales siguen sin evidencia por falta de herramientas/entorno.
