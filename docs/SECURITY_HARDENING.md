# Endurecimiento preparado y límites

Código preparado: usuario API no-root y nginx sin privilegios, raíz read-only/tmpfs/cap_drop en Compose, DB sin puerto público, roles app/migración separados localmente, TLS DB verify-full requerido staging/producción, TrustedHost explícito, DEBUG/OpenAPI deshabilitados fuera de debug, cierre de engines, logs mínimos/no-store y gate deny por defecto.

Proxy preparado: nosniff, no-referrer, Permissions-Policy restringiendo cámara/geolocalización y micrófono solo self, CSP script self/object none/base self/frame-ancestors none, recursos sin hash con revalidación. style-src permite unsafe-inline por estilos existentes: no se presenta como endurecimiento final. CSP/nginx no se ejecutaron con Docker; revisar todos los módulos, audio/blob/worker y errores antes de exigirla en producción.

HTTPS/HSTS no configurados: pendiente terminador autorizado y pruebas reales. No desactivar TLS/CSRF ni usar CORS * por conveniencia. API no confía en forwarded headers hasta fijar proxies reales. Secrets externos, .dockerignore/.gitignore, sin claves AI en frontend/imagen. MFA y mínimos privilegios en consola/proveedor/CI/buckets/DB deberán configurarse con el titular; no se modificaron cuentas o políticas remotas.

Persisten hallazgos altos Fase 48: autorización granular, pruebas tenant reales, archivos, cache/IDB compartidos, integridad/concurrencia y módulos faltantes. No habilitar menores por existir infraestructura. SCA/SBOM/escaneo de imágenes/secretos/firmas requieren herramientas y revisión, no realizados.

Referencia OWASP consultada: https://owasp.org/Top10/2025/ (el índice oficial remite a Top 10:2025). Se usa como orientación para control de acceso, configuración, cadena de suministro, criptografía, inyecciones, autenticación, integridad, logging y condiciones excepcionales; no es certificación ni sustituto de pruebas específicas.

## Referencias oficiales peruanas consultadas

Consulta de fichas oficiales ANPD realizada en esta intervención (UTC 2026-10-24):

- Ley 29733, ficha oficial: https://www.gob.pe/institucion/anpd/normas-legales/2018427-29733-2011
- Reglamento, DS 16-2024-JUS (30/11/2024): https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus
- RD 100-2025-JUS-DGTAIPD (31/12/2025), directiva del Oficial de Datos Personales: https://www.gob.pe/institucion/anpd/normas-legales/7574631-100-2025-jus-dgtaipd

El fetch del PDF reglamentario no fue soportado por la herramienta. La lectura de fichas **no es revisión completa de artículos, modificaciones vigentes o aplicabilidad** ni certificación de cumplimiento. Requiere asesoría especializada: tratamiento de menores/fundamento/autorizaciones, bancos de datos/derechos, encargados/transferencias, seguridad/incidentes, retención/backups y si corresponde designar oficial. No se deducen obligaciones o plazos universales sin esa revisión.
