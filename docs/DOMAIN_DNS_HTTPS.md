# Dominio, DNS y HTTPS

No existe dominio/proveedor autorizado identificado; no se compró, cambió DNS o emitió certificado. example.invalid en plantillas es reservado y no una URL desplegada.

Objetivo: origen HTTPS único para frontend y /api/v1. El proveedor elegido debe terminar TLS 1.2/1.3, renovar certificados, limitar acceso al origen API y preservar Host/contexto seguro. Nginx local solo escucha HTTP loopback; **no es configuración HTTPS de producción**.

Pasos pendientes autorizados: verificar titularidad/dominio → decidir A/AAAA/CNAME según proveedor real → definir acceso de staging → provisionar certificado sin exponer clave → verificar cadena/hostname/renovación → redirigir HTTP → revisar contenido mixto, CORS, cookies Secure, CSRF, SW y HSTS gradual. No activar includeSubDomains/preload sin evaluar todos los subdominios.

API no confía en proxy headers arbitrarios (`--no-proxy-headers`); una plataforma futura deberá declarar proxies confiables específicos antes de depender del esquema reenviado. No usar '*' para resolverlo. TrustedHost exige hosts de entorno, no IP de mantenimiento universal.

Pruebas TLS/DNS/certificados/cookies/CSRF en host real: no ejecutadas. No se presenta plantilla como certificado válido o despliegue terminado.
