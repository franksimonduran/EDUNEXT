# Línea base de rendimiento

## Medición adicional 2026-10-27

Se conserva una línea base anterior a las correcciones de este pase:
`final/evidence/phase48-baseline-20261027T032140720870Z/RESULTS.json`.
ASGI in-process health/live: 100 peticiones, concurrencia 4, sin sockets/lifespan/DB;
no login, estudiantes reales o carga representativa. Con tracemalloc activado:
p50 14.102 ms, p95 16.826 ms, p99 91.416 ms, 0 no-200; CPU proceso 0.515625 s,
pico de asignaciones Python 387.962 bytes (no RSS ni prueba de fuga).

Probe de limitador con 5.000 claves sintéticas: 5.000 retenidas, 72.054 ms,
pico Python 1.094.546 bytes. Es medición de función local, no tráfico de fuerza bruta.
Entorno: Windows, Python 3.11, Node 24.22.1, versiones/hardware lógico en JSON fuente.
No se deducen capacidad de producción, SLA o experiencia de menores de estos datos.

## Mediciones históricas

Solo se midió navegación del login **estático local** mediante servidor Node efímero y navegadores headless reales. No FastAPI/BD ni emulación de CPU/red lenta. Windows, Node v24.22.1; hardware lógico en PHASE_48_BASELINE_EVIDENCE.json. No se midió consumo CPU/memoria de la aplicación.

PHASE_48_BROWSER_EVIDENCE.json contiene tiempos Navigation Timing de una navegación por tamaño. Edge 156.0.4314.42: 68.8 / 32.3 / 30.4 / 28.9 ms; Chrome 156.0.8078.48: 61.3 / 24.6 / 22.4 / 21.7 ms (320/375/768/1440 px). Son muestras locales posteriores a cambios, no comparación antes/después ni experiencia de usuarios reales.

No medidos: LCP, INP, CLS, bytes transferidos reales por flujo, p50/p95/p99 de API, throughput, errores bajo carga, consultas PostgreSQL, memoria sostenida. Tamaños de fuentes en inventario no son recursos transferidos ni contenido multimedia completo.

Duraciones de suites Node en REGRESSION_EVIDENCE son tiempo de ejecución de tests, **no latencia de plataforma**. No hay aprobación de capacidad/rendimiento ni objetivo alcanzado por estos números.
