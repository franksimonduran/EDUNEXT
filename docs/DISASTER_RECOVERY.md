# Recuperación ante desastres

No se midieron RPO/RTO ni se probó recuperación. Propuestas iniciales heredadas de Fase 48: RPO 15 min/RTO 4 h para discusión, no compromiso aprobado ni capacidad implementada; un pg_dump ocasional NO demuestra RPO 15 min/PITR.

| Incidente | Acción segura propuesta | Dependencia / responsable |
|---|---|---|
| DB inaccesible | Readiness 503, detener promociones, conservar operaciones locales, evaluar causa/conexiones | Operador DB por asignar |
| Corrupción/pérdida | Aislar escrituras, preservar evidencia, verificar backup cifrado, restaurar copia nueva y reconciliar antes de cortar tráfico | Custodio + responsable académico |
| Pérdida de archivos | Restaurar versiones/checksums compatibles con snapshot DB, no asumir que metadata contiene bytes | Adapter/proveedor aún ausente |
| Despliegue defectuoso | Volver a imagen/configuración compatible, sin downgrade automático | Responsable release |
| Secreto comprometido | Contener acceso, evaluar impacto/notificación, rotación autorizada y revocación de sesiones según política | Seguridad/privacidad por designar |
| Error Sync tras restore | No reenviar masivamente; reconciliar recibos/cursores/IDs confirmados antes de habilitar push | Motor Sync actualmente ausente |
| Proveedor AI caído | Mantener enseñanza básica, indisponibilidad honesta, sin fallback externo automático | Proveedor deshabilitado |

Restaurar a entorno aislado, probar datos/tenant/archivos y decidir corte con aprobación. Registrar tiempos reales, punto recuperado y operaciones potencialmente afectadas, nunca inventar garantías. No sobrescribir datos nuevos con backup antiguo ni utilizar notas locales como autoridad. Contactos, canal y suplencias pendientes de nombramiento; no se inventan personas.
