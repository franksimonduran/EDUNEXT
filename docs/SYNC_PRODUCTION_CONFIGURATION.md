# Sync en infraestructura

SYNC_ENABLED=false. No existe backend completo de Fase 46 registrado; no se inventan tablas de recibos/cursores, push/pull o jobs. Una red/volumen no implementa idempotencia. Insights también sigue sin motor operativo registrado.

SW existente se conserva sin purgas; manifiesto nuevo solo describe entrada/scope/icono. No se afirma descarga/versionado/checksum de paquetes ni instalación certificada. Cliente viejo offline, varias cuentas, pérdida de respuesta, reinicio y reconciliación tras restore sin probar.

Antes de habilitar Sync real: contratos y backend de recibos persistentes, IDs de operación estables y payloads permitidos, paquetes autorizados/checksums, límites de batch/backoff/jitter/concurrencia medidos, cursores e invalidación/compatibilidad versionada y separación de cuentas demostradas. Nunca roles/matrículas/notas/AD/A/B/C por sincronización genérica.

Proxy inicial local 5m/35s no es dimensionamiento certificado para paquetes o reconexión masiva. Ajustar solamente con backend/paquetes reales y medidas; no abrir límites ilimitados. Tras restauración, reconciliar recibos/cursores antes de reenvío; no aplicar última escritura gana a registros académicos.
