# Privacidad y límites

No se almacenan credenciales en la nueva cola/recibos. Solo UUID de lección/versión,
cuenta/institución, estados y fechas; no respuestas, calificaciones, voz o conversaciones.
API private/no-store; el SW sigue excluyendo API/bearer y escrituras.
El middleware de límite existente se reutiliza con código SYNC_BODY_LIMIT sin
alterar su límite/código AI predeterminado. No se imprimen payloads privados en logs.

No hay cifrado local ni desbloqueo offline seguro. La separación lógica no protege
contra inspección del mismo perfil del navegador o XSS. No se declara aptitud para
equipos compartidos con información sensible. Revocación offline no elimina
instantáneamente copias desconectadas. Producción y piloto siguen NO-GO.
