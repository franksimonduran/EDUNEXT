# Limitaciones y riesgos Fase 49

**Bloqueantes/altos:** Fases 47/48 sin aceptación; backend/cambios TLS/config/readiness/logs sin ejecución; aislamiento y registros académicos sin E2E; offline compartido/Sync incompleto; almacenamiento privado sin adapter; proveedor/dominio/secretos/CA no configurados; restore real no probado.

**Build/suministro:** imágenes fijadas con metadatos consultados, pero no descargadas/escaneadas/firmadas. requirements.lock ausente; release build deniega por defecto. Desarrollo resuelve rangos y no es release reproducible. CI/workflows solo fuente, sin ejecución remota/protecciones verificadas.

**Operación:** Compose solo HTTP loopback con DB local persistente preparada, no staging ni HA. No métricas exportadas/colector/dashboard/canal de alerta/scheduler backup. Script backup cifrado aún sin prueba; no incluye archivos privados/PITR. RPO/RTO no medidos/aprobados.

**Frontend:** manifiesto usa SVG existente, sin íconos raster/compatibilidad universal certificados. SW no cambiado en esta fase; no se probó actualización/pérdida de respuestas/cuentas. CSP de proxy sin nginx real y unsafe-inline de estilos por compatibilidad existente; no CSP final auditada.

No se contrataron servicios, migraron bases reales, modificaron secretos existentes, publicaron DNS/certificados ni desplegaron usuarios reales. Las fichas legales consultadas no demuestran revisión exhaustiva de modificaciones o cumplimiento. Fase 50 no autorizada/preparada por estos archivos.
