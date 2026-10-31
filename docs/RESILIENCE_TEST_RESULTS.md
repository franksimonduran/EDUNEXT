# Resultados de resiliencia

| Caso | Entorno | Resultado |
|---|---|---|
| Cuerpo HTTP detenido después de cabeceras | Servidor Node 127.0.0.1, timeout cliente 80 ms | TIMEOUT observado; suite pasa |
| Cancelación durante cuerpo HTTP | Misma fixture, abort programado 40 ms | AbortError observado |
| 403 con Request-ID | Misma fixture | No tratado como desconexión; metadatos preservados |
| Refresh/respuesta tardía vs logout | Transporte simulado | No restaura access token; respuesta anterior rechazada |
| Cuota de cache.put | VM de SW, error sintético | Respuesta de red 200 se conserva |

Valores 80/40 ms son configuración de fallo, no SLA medido. Evidencia ejecutable en suites y JSON de regresión.

No ejecutado: interrupción PostgreSQL, commit con respuesta perdida, reinicio de navegador con IDB real, caída de proveedor AI real, operaciones Sync/recibos/cursores, backups/restauración, RPO/RTO observados. No se demuestra ausencia de pérdida/duplicación de datos académicos con estas fixtures.

## Continuación 2026-10-27

Pruebas nuevas con filesystem sintético real: payload sobredimensionado y stream
de lecturas parciales no truncan archivo previo; fallo inyectado de os.replace
preserva sus bytes y limpia solo temporal propio. No son backups ni rollback DB.
Expiración del limiter con reloj controlado recupera capacidad sin expulsar contadores.
ASGI de fallo Reports devuelve 503/rollback sin detalles SQL privados.

Regresiones seleccionadas: error proveedor Ollama mediante MockTransport no inventa
texto/unidades; cuota/cache/timeout/session/cola con dobles siguen pasando. Ninguna
simulación se presenta como proveedor operativo, commit PostgreSQL o IDB real.
Restauración/RPO/RTO, fallos DB y recuperación completa permanecen sin evidencia.
