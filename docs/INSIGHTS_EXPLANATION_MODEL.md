# Explicaciones

Cada ítem separa valor observado, explicación descriptiva y sugerencia opcional.
Incluye `insight_id`, `insight_type`, `rule_code`, `rule_version`,
`source_metric_ids`, `source_report_id`, `metric_definition_version`,
`academic_period_id`, `institution_context`, `source_reference`, `generated_at`,
`data_status`, `observed_value`, `explanation`, `suggestion`.

Metadatos conservan filtros, zona, población, fuentes y limitaciones del reporte.
Si no se pidió periodo, es null: no se atribuye el resultado al periodo actual.
No hay explicación generada por IA ni interpretación de observaciones privadas.

La versión de definición es la versión del reporte, no una supuesta versión
independiente de cada registro. La fuente puede cambiar tras la consulta:
se requiere recalcular. No se promete vigencia continua ni snapshot histórico.
