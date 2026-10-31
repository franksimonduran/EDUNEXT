# Fase 49 — arquitectura de infraestructura

Estado: archivos preparados parcialmente; sin despliegue. Producción bloqueada por Fases 47/48 y falta de autorización/proveedor. No se inició Fase 50.

```text
Objetivo futuro autorizado:
Internet → dominio/TLS del proveedor → frontend estático + proxy /api/v1
                                      → FastAPI (una aplicación)
                                        → PostgreSQL privado con TLS verificado
                                        → almacenamiento privado autorizado [pendiente]
                         logs técnicos → monitor privado [pendiente]
PostgreSQL + archivos → backups cifrados separados → restauración aislada

Local preparado, NO ejecutado:
127.0.0.1:8080 → web nginx → api:8000 → db:5432 (red interna, volumen)
```

Compose es solo desarrollo sintético, HTTP loopback; no representa staging HTTPS. API y DB no publican puertos. No se crean microservicios para AI/Insights/Sync: sus capacidades pertenecen al backend cuando existan. Actualmente Insights/Sync no tienen motores registrados completos y archivos subidos no tienen adapter persistente.

La imagen frontend solo incluye recursos públicos del repositorio; nunca adjuntos/evidencias. Un solo origen resuelve `/api/v1` del cliente existente. TLS real, almacenamiento administrado, registro de imágenes, monitoreo y presupuestos esperan proveedor y aprobación. No se contrataron servicios ni se configuró DNS.

Límites: proxy/API, API/DB, DB/roles, operador/secretos, navegador/IDB y proveedor AI. Referencias: SECURITY_THREAT_MODEL.md, PRODUCTION_SECURITY_GATE.md y release-gate.json (deny por defecto).
