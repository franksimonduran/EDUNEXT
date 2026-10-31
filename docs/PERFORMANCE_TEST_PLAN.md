# Plan de rendimiento controlado

Precondiciones: Python/BD de prueba aislada operativos, integración crítica resuelta, semillas de dos instituciones ficticias, autorización explícita del operador y supervisión de recursos. No ejecutar pytest destructivo ni pruebas de carga en datos desconocidos.

Escenario inicial propuesto, no ejecutado: 1 usuario y luego 2–5 concurrentes, máximo 100 solicitudes/escenario y 30 segundos, detener por errores inesperados, agotamiento de recursos o impacto fuera de la fixture. Son límites de seguridad iniciales, no demanda real ni capacidad prometida. Ampliar solo tras medir y autorizar.

Medir separado: login/refresh, cursos/lecciones, práctica/respuesta/entrega, progreso, tareas, reportes autorizados y reconexión Sync si existe. AI con dobles sin costo. Capturar p50/p95/p99, muestras, errores por código, CPU/memoria, consultas, pool, duplicados y aislamiento antes/después.

Objetivo propuesto: bajo el mismo hardware/datos/carga no introducir regresión de latencia/errores respecto de baseline representativo aprobado; ningún duplicado académico ni cruce institucional. Objetivos absolutos de latencia/throughput pendientes de requisitos e infraestructura; no inventar un SLA.

Pico/duración/reconexión masiva quedan bloqueados por Fase 47 y ausencia de Sync. No se instalaron Locust/k6 ni se generó tráfico masivo para cubrir una lista.
