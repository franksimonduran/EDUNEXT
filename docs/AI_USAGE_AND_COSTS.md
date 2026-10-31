# Uso y costos

Reserva PostgreSQL ANTES de llamar al modelo, con bloqueo de fila institucional.
Límites: usuario/institución por día civil institucional, entrada, salida, solicitudes
en vuelo, timeout y transporte. Se revalida política bajo bloqueo. No se confía en JS.

Predeterminados: 20 solicitudes/usuario/día, 200/institución/día, 1000 caracteres,
256 tokens de salida. Política admite máximos 100, 2000, 1500 y 512 respectivamente.
Traducción tiene máximo adicional 1000 caracteres. Transporte 16 KiB; salida JSON
proveedor 64 KiB; texto final 3000 caracteres por defecto.
AI_MAX_INFLIGHT_PER_INSTITUTION por operador: 2, rango 1–4; ventana de reserva
activa de dos timeouts. No garantiza cancelar cómputo del daemon tras timeout.

Idempotency-Key UUID se reserva por usuario/institución. Repetir devuelve 409 sin
volver a inferir; respuestas no se almacenan para reproducirlas. Frontend conserva
clave de un intento fallido equivalente mientras permanece la vista.
No hay reintentos automáticos costosos ni devolución automática de cuotas tras fallo.
Cancelación/caída puede dejar reserva sin resultado: se cuenta conservadoramente.

Solo se guardan unidades devueltas por proveedor; si faltan son null, nunca tokens
estimados inventados. Los valores de los tests son sintéticos y no consumo real.
Costo/currency null: no se verificó precio API ni consumo económico del hardware.
No se afirma costo cero. No hay adaptador cloud ni presupuesto monetario medido.

Circuit breaker de transporte por proceso, no distribuido. Cuotas son PostgreSQL.
No se conserva prompt/respuesta en uso: solo fingerprint HMAC, actor/institución,
operación, servicio, proveedor, estado, unidades conocidas, latencia y expiración.
No se persiste versión/digest del modelo por evento; trazabilidad avanzada pendiente.
