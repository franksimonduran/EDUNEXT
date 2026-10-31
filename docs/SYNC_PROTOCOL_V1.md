# Protocolo V1 limitado

Lista finita: solo finalización autodeclarada de lección vigente. No admite
dependencias, timestamps autoritativos, tablas, notas o identidades efectivas del cliente.
Máximo 25 operaciones únicas y 16 KiB HTTP por lote (también cuerpos fragmentados).

Bootstrap devuelve contexto de sesión y capacidades, no copia la institución.
Push es de atomicidad **individual**: cada efecto y recibo se confirman juntos;
un fallo posterior no revierte operaciones anteriores ya confirmadas.

Resultado por operación: applied/already_applied con fecha servidor y versión;
rejected/conflict/retryable sin fecha de confirmación. Un HTTP 200 de lote no
confirma cada operación. Una respuesta perdida se reintenta con el mismo ID.

Cuenta/institución esperadas deben coincidir con sesión; si cambian, HTTP 409
antes de aplicar el lote. La sesión sigue siendo la fuente de identidad.
No hay pull/cursor/tombstones ni compatibilidad offline histórica garantizada.
Versiones de lección obsoletas entran en conflicto y no se convierten a la nueva.
