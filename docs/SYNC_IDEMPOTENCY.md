# Idempotencia y recibos

Tabla nueva `sync_operation_receipts`; unicidad compuesta por institución, actor
y client_operation_id. SHA-256 de JSON canónico validado identifica el contenido.
No es una firma ni fuente de autorización; actor e institución proceden de sesión.

El servicio bloquea el perfil estudiantil antes de consultar recibo y reutiliza
ProgressService (mismo bloqueo). Efecto, reconocimientos y recibo comparten commit.
Cliente conserva ID estable; si pierde respuesta puede repetir o consultar recibo.
Commit fallido nunca produce respuesta applied. Error ambiguo conserva operación.

No se eliminan recibos automáticamente. Horizonte/retención institucional todavía
requieren aprobación y mecanismo que evite replays después de archivo/eliminación.
La migración usa FK RESTRICT y downgrade denegado para no destruir deduplicación.
Concurrencia real PostgreSQL y rollback aún no probados; no se declara garantía E2E.
