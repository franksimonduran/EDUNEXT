# Hosting, costos y capacidad

No proveedor existente identificado ni servicios contratados. No se verificaron tarifas comerciales y no se inventan importes. Se consultaron metadatos públicos de imágenes oficiales para fijar digest, no precios ni capacidad cloud.

| Alternativa a evaluar | Ventaja esperada | Carga/riesgo a verificar antes de elegir |
|---|---|---|
| PaaS + PostgreSQL administrado + objetos privados | Menor operación de SO/TLS/backups | Región/transferencias, límites/red, PITR/restores, egress, costo, SLA y portabilidad |
| VM para proxy/API + DB administrada + objetos | Mayor control ASGI/red/proxy | Parches/MFA/firewall/monitoreo/operador y compatibilidad TLS |
| Servidor propio/VM todo en uno | Simplicidad inicial y control local | Mayor responsabilidad de disponibilidad, energía, disco, copias fuera del host y recuperación; no HA implícita |

Ninguna decisión de región, proveedor o precio está tomada. Comparar contrato de privacidad, soporte, exportación, backups verificables y costo total, no solo cuota inicial.

Modelo de costos: cómputo API/proxy + DB/IO/conexiones + almacenamiento público/privado + transferencia/descargas + backups separados/retención + dominio/TLS según proveedor + observabilidad + AI autorizado. Valores y presupuestos: pendientes. No activar servicios de pago o alertas de facturación sin autorización.

Escenarios por validar (sin matrícula institucional inventada): desarrollo local sintético; staging separado con doble institución ficticia; piloto condicionado a Fases 47/48/49; crecimiento medido. Recabar usuarios concurrentes, instituciones/aulas, tamaño/frecuencia de paquetes, audio, entregas, retención y patrón de reconexión. Un worker/pool actual no acredita capacidad escolar.

Escalar por evidencia: CPU/latencia/errores sostenidos → API; saturación/locks/conexiones → consultas/pool/DB; crecimiento/egress → objetos/CDN solo públicos; trabajos duraderos medidos → worker cuando se justifique. No añadir Redis/Kubernetes/colas por anticipación ni duplicar sweeper en muchos workers sin plan.
