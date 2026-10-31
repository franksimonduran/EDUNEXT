# Resultados de rendimiento

## Comparación acotada 2026-10-27

| Medida | Antes | Después final |
|---|---:|---:|
| Peticiones / concurrencia health ASGI | 100 / 4 | 100 / 4 |
| p50 / p95 / p99 ms | 14.102 / 16.826 / 91.416 | 13.707 / 16.696 / 89.363 |
| Respuestas no-200 | 0 | 0 |
| CPU proceso s | 0.515625 | 0.5 |
| Pico tracemalloc health, bytes | 387962 | 387942 |
| Claves retenidas en 5.000 comprobaciones del limitador | 5000 | 4096 |
| Duración probe limitador ms | 72.054 | 112.513 |
| Pico tracemalloc limitador, bytes | 1094546 | 1018505 |

Resultado posterior: `final/evidence/phase48-after-20261027T033916705619Z/RESULTS.json`.
Una muestra antes/después, diferente estado de herramientas del venv; no prueba
mejora estadística de latencia ni ausencia de fugas. El control más estricto añade
costo al limitador y limita memoria/cardinalidad; no se presenta como aceleración.
Objetivo del smoke: cero errores inesperados, no un SLA de plataforma.

No se ejecutaron carga representativa, estrés, soak, reconexión masiva, PG/EXPLAIN,
LCP/INP/CLS, RSS sostenido o dispositivos físicos limitados. Rendimiento integral
no aprobado. Se conservan abajo los resultados históricos.

Ejecutado: medición acotada Navigation Timing de login público en Edge/Chrome, cuatro tamaños. Valores y condiciones en PERFORMANCE_BASELINE.md y JSON de navegador. Sin desbordamiento horizontal en esas ocho muestras.

No ejecutados: carga normal FastAPI, pico, estrés, soak, reconexión masiva, consultas EXPLAIN, pool bajo concurrencia, p50/p95/p99, CPU/memoria sostenidas, Web Vitals y dispositivos físicos limitados. No hay tasas de éxito/capacidad inventadas.

Comparación antes/después disponible solo para defectos funcionales SW (4 fallos iniciales, suite final ampliada) y pruebas de regresión; **no comparación de rendimiento de plataforma**. No se crearon índices ni se ajustó pool por intuición.

Decisión: rendimiento integral no evaluado suficientemente; no aprobado. La plataforma no está lista para producción por pasar el login estático rápidamente.
