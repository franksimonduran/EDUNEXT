# Monitoreo y alertas

Preparado en código: liveness y readiness acotada que consulta PostgreSQL y revisión esperada; respuestas públicas mínimas. Logs JSON con duración/status/request ID y ruta de contrato (sin IDs concretos) permiten agregación técnica. No hay colector/exporter Prometheus, dashboard o canal conectado; no se simula monitoreo operativo.

infra/monitoring/alerts.example.json contiene reglas propuestas, responsable y canal sin asignar. Ejemplo: tres fallos consecutivos de readiness cada 30s; no SLO aprobado. Umbrales de 5xx, latencia, conexiones/disco y presupuesto AI requieren baseline/contrato. No alertar por estudiante ni por contenidos de respuestas.

Dashboard técnico privado futuro: probes HTTPS/frontend/API/DB, latencias por ruta, 5xx/timeouts, conexiones/espacio, resultado/antigüedad de backup y último restore observado. AI solo counters/latencia/cuotas agregados; Sync no tiene métricas reales porque falta motor. La consola administrativa institucional no recibe secretos cloud ni métricas individuales de conversaciones.

Canales: pendientes de autorización y asignación de responsables/escalamiento; no se enviaron notificaciones. Probar fallo sintético en staging y recepción real antes de dar por configurada una alerta. No usar logs como backup de respuestas.

SLI propuestos: éxito de probes críticos, latencia/error por endpoint, antigüedad de backup/drill, confirmación Sync cuando exista. SLO/ventanas/presupuesto de error aún sin números aprobados. Nada garantiza disponibilidad por encontrar health endpoints.
