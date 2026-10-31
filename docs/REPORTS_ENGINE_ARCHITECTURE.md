# AITHRON Reports Engine — FASE 43

Estado: implementación real de alcance parcial. No es un servicio de boletas oficiales.

## Capas

- HTTP: `app/api/v1/endpoints/reports.py`, registrado en `/api/v1/reports`.
- Contratos: `app/schemas/report.py` (filtros estrictos, metadatos, métricas, filas y exportación).
- Definiciones versionadas: `app/services/report_definitions.py`. Códigos permitidos,
  permisos, filtros, fuentes, población y diccionario central; nunca SQL recibido del cliente.
- Orquestación/autorización: `ReportService`; identidad institucional activa y
  permisos del reporte más permisos de sus fuentes. No se elevan permisos internamente.
- Consultas: `ReportRepository`, SQLAlchemy parametrizado y agregaciones PostgreSQL.
- Fuentes compartidas: ProgressService, MonitorProgressService, consulta de catálogo
  de ProgressRepository y estados de entrega centralizados en planner_rules.
- Exportación: `app/exporters/csv_exporter.py`, CSV acotado en memoria.
- Auditoría: `ReportAccessEvent`, sin cuerpos de reportes ni respuestas estudiantiles.

## Consistencia

Cada consulta HTTP de datos usa una transacción REPEATABLE READ y statement_timeout
de 10 segundos. Se calcula desde fuentes originales; no hay tablas duplicadas de
notas, porcentajes ni snapshots de reportes. Lecturas de reporte agregan únicamente
auditoría propia y confirman antes de responder. Fallo SQL o de auditoría produce
rollback y 503 genérico, no valores cero de respaldo.

Progreso curricular reutiliza FASE 41. Los estados de recepción, revisión y pendiente
de tareas se comparten con FASE 42. Consulta de contenido publicada se extrajo como
statement reutilizable para contar en SQL sin cargar todas las lecciones.

## Seguridad y privacidad

Institución se obtiene de sesión; `institution_id`/`student_id` no son filtros
admitidos. Docente necesita aula/curso y relación real. Agregados de matrícula usan
particiones fijas por grado con supresión de distribución y totales si hay celdas
pequeñas. Exportación aplica la misma consulta y política de privacidad.

## Integración

Visor compartido HTML/JS reutilizado dentro de progreso estudiante y centros de
reportes Monitor/Administrador. Mantiene demo separado, tablas accesibles y
medidores con texto. No se reconstruyeron dashboards ni Service Worker.

Consultar REPORT_DATA_SOURCES, REPORT_METRIC_DICTIONARY, REPORT_TEST_RESULTS y
REPORT_KNOWN_LIMITATIONS para límites y aceptación.
