# Almacenamiento

Implementado: assets públicos existentes distribuidos con frontend inmutable. No se usan para evidencias privadas. No hay adapter operativo de bytes subidos/streaming: endpoints devuelven 503 desde Fase 48. Agregar un volumen vacío no resolvería ese contrato; no se finge persistencia.

| Clase | Destino/política propuesta | Estado |
|---|---|---|
| Imágenes/audio educativo aprobado | Artefacto versionado o almacenamiento público aprobado | Assets existentes; licencias/contratos por revisar |
| Paquetes/manifiestos offline | Objetos versionados con checksum y acceso de dominio | Motor Sync no operativo, bloqueado |
| Adjuntos/evidencias/exports | Almacenamiento privado, autorización FastAPI y ámbito institucional | Adapter/proveedor no configurado |
| Audio personal | Solo consentimiento/política/retención autorizados | No habilitado ni capturado |
| Temporales | Límite de tamaño/vida y limpieza autorizada | Diseño pendiente; no eliminar evidencia académica |

Proveedor/volumen debe soportar cifrado, control de acceso, restauración coherente con DB y límites. Nunca montar archivos privados bajo /usr/share/nginx/html o frontend/assets. URLs difíciles de adivinar no reemplazan autorización. No enlaces firmados ficticios, no buckets creados.

Respaldo futuro: tomar snapshot/versiones de archivos coherentes con metadatos DB, registrar catálogo/checksums cifrado, restaurar ambos y comprobar referencias. El script pg_dump no respalda archivos privados. Costos/retención/egress y licencias requieren aprobación; no hay almacenamiento privado persistente verificado.
