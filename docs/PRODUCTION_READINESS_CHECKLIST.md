# Checklist producción — NO READY

P = preparado en fuente, V = verificado en el alcance indicado, B = bloqueado/pendiente. Ningún P equivale a desplegado.

| Condición | Estado | Evidencia / pendiente |
|---|---|---|
| Arquitectura e inventario | P | Docs y tabla de preparación; proveedor pendiente |
| Fase 47 integrada / Fase 48 aceptada | B | Ambas actas no aprobadas |
| Build reproducible/release | B | Lock con hashes ausente; Docker no ejecutado |
| Bases de imagen por digest | V limitado | Metadata de registro consultada; no ejecución/scan |
| Entornos/secretos separados | P/B | Plantillas, no infraestructura/ACL reales |
| PostgreSQL persistente/roles/TLS | P/B | Compose/helpers; sin conexiones reales |
| Migraciones staging autorizadas | B | Procedimiento explícito; no aplicado |
| Frontend/proxy/health/readiness | P/B | Código; smoke fixture no acredita app/DB |
| Dominio/HTTPS/cookies/CSRF | B | Sin dominio/terminador/certificado probado |
| Auth/RBAC/tenant/privacidad menores | B | Riesgos altos y E2E pendientes |
| Almacenamiento privado y archivos | B | Adapter ausente; 503 explícito |
| PWA/actualización/IDB/cuentas | P/B | Manifiesto válido en contrato; instalación no probada |
| AI autorizada y limitada | B | Deshabilitada, sin proveedor verificado |
| Sync recibos/idempotencia/paquetes | B | Motor ausente/incompleto |
| CI/build/artefactos | P/B | Workflows preparados; sin ejecución remota |
| Promoción manual | V limitado/P | Gate local deniega; protección GitHub y despliegue real pendientes |
| Backups cifrados/restauración | P/B | Script/plan, sin backup ni restore real |
| Logs/métricas/alertas | P/B | Código/reglas; sin colector/canal probado |
| Costos/región/proveedores/responsables | B | Decisiones y aprobación pendientes |
| Rollback/DR | P/B | Runbooks, sin ensayo de infraestructura |
| Integridad académica/AD-A-B-C | B | No se cambió, pero pruebas reales pendientes |
| Autorización expresa de publicación | B | No concedida |

Clasificación lanzamiento: **Not ready / Bloqueada por Fase 48**. No staging ready, production technically prepared o deployed and verified. Gate JSON es deny por defecto y solo organizativo; no sustituye controles reales de proveedor/revisión.
