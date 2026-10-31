# Manifiestos y límites del contrato actual

El protocolo de progreso usa UUID de versión publicada existente, no un manifiesto
nuevo. No genera firmas/checksums de recursos ni afirma autenticidad por SHA-256.

Para futuros paquetes se deben reutilizar manifiestos Fases 38/39 y validar:
package_id/version/schema, versiones de contenido, recursos obligatorios y dependencias,
tamaños conocidos y hashes calculados de bytes reales. La integridad exige comparar
bytes descargados con manifiesto obtenido por canal autorizado.
Nada de ello está habilitado por endpoints `/sync/packages` en esta entrega.
