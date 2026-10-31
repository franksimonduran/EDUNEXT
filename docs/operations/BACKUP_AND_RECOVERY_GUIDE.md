# Respaldo/recuperación en la entrega

Estado: script y runbooks, **sin backup ni restauración observados**. No adjuntar datos sensibles/clave privada de age a Git o entrega pública. [Procedimiento preparado](../BACKUP_AND_RESTORE.md) y [DR](../DISASTER_RECOVERY.md).

Antes de ensayo: fuente sintética autorizada, herramientas/clave/destino externo, acceso mínimo, copia cifrada, DB destino vacía exclusiva _restore_test, verificación de esquema/archivos/conteos/tenant y tiempos reales. No restore encima de producción, no clean/drop para acelerar. Checksum/exit 0 no acredita recuperación educativa completa.

RPO/RTO y retención por aprobar; propuestas anteriores no se lograron ni son SLA. Custodios/contactos faltan. Gate de piloto/lanzamiento permanece cerrado sin recuperación apropiada al alcance.
