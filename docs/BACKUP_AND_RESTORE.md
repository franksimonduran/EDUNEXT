# Backups cifrados y restauración — no ejecutados

No se creó backup, configuró scheduler/destino ni realizó restore. Faltan Python operativo, pg_dump/pg_restore/psql y age, además de base sintética/clave/servicios externos de libpq. Copiar archivos de código no respalda PostgreSQL o evidencias.

Script preparado: infra/backups/postgres_backup.py. Backup pg_dump custom se cifra por pipe con age (sin archivo de dump plano). Valores de conexión vienen de PGSERVICEFILE y PGPASSFILE externos al repositorio; no passwords/URLs en argumentos. Requiere confirmar nombre de servicio; genera archivo UUID .dump.age y metadata con SHA-256 del ciphertext y restoreVerified=false. Fallos conservan .incomplete para revisión, no se borran datos.

Ejemplo de comandos **no ejecutados**, desde raíz, con rutas externas propias y exclusivamente fuente sintética autorizada:

```powershell
$env:PGSERVICEFILE = 'C:\ruta-privada\pg_service.conf'
$env:PGPASSFILE = 'C:\ruta-privada\pgpass.conf'
python infra/backups/postgres_backup.py backup --service aithron_staging_backup --confirm-service aithron_staging_backup --recipients-file C:\ruta-privada\age-recipients.txt --output-dir C:\backups-aislados
python infra/backups/postgres_backup.py restore-test --service aithron_restore_test --confirm-service aithron_restore_test --confirm-database aithron_restore_test --archive C:\backups-aislados\ARCHIVO.dump.age --identity-file C:\ruta-privada\age-identity.txt --sha256 HASH_DEL_MANIFIESTO
```

Rutas/nombres son ejemplos, no archivos existentes. Preparar DB destino vacía separada antes del drill. Restore verifica SHA del cifrado, valida descifrado completo, consulta nombre real de DB y ausencia de objetos de usuario, exige sufijo _restore_test y confirmación exacta; usa pg_restore single-transaction/exit-on-error, sin clean/drop. No autoriza restaurar encima de producción. Operador debe garantizar destino exclusivo: la comprobación previa no es bloqueo distribuido frente a otro escritor.

Completar verificación tras restore: revisión Alembic, relaciones/conteos/checksums sintéticos, arranque con roles adecuados, archivos privados coherentes, auth/tenant y recibos/cursores si existen. Un checksum o exit 0 no acredita recuperación completa. Script, cifrado y manejo de fallos aún sin ejecución real.

Política propuesta por aprobar: frecuencia según RPO requerido, retención limitada y revisada legalmente, cifrado, copia separada del servicio/disco, acceso de mínimo privilegio, custodia/recuperación de clave y restore drills periódicos. No se fija periodo legal universal ni se elimina ninguna copia. El script no hace backup de archivos privados, WAL/PITR o secretos; deben resolverse con proveedor/adapter antes de producción.
