# Seguridad de API

Inventario estático previo: INTEGRATION_ENDPOINT_INVENTORY.md y JSON. No se obtuvo OpenAPI del servidor ni se certifica montaje/protección de todas las rutas. Validación Pydantic y límites de login se observaron en fuente; no se probaron todos los payloads/extra fields/UUID/estados.

Consultas seleccionadas usan SQLAlchemy con parámetros y filtros institucionales; interpolar el patrón de LIKE como valor no es por sí solo inyección SQL. Escáner estático marca coincidencias, no prueba resistencia global. No se realizaron inyecciones contra una BD ni sistema externo.

Cliente diferencia 400/401/403/404/409/422/429/500/503; conserva fields/Retry-After/Request-ID. Transporte simulado pasa; HTTP loopback real confirma 403 y Request-ID, no FastAPI. API middleware ahora aplica no-store/nosniff/no-referrer y elimina logs con str(exc); no certifica páginas estáticas servidas fuera de FastAPI.

Ollama usa loopback HTTP, sin redirects ni proxy de entorno; URLs no proceden del usuario final. Sin prueba activa SSRF. Upload/download devuelven 503 por almacenamiento no implementado, evitando éxito falso y exposición de ruta en endpoint download. ResourceRead/metadatos y otros campos de almacenamiento aún requieren minimización por schema.

Pendiente: mass assignment, CSV/filtros/autorización real, body limits globales y multipart antes de entrar al handler, excepciones 500 del framework, XSS por cada sink, descarga privada real, rate limit de búsquedas/exportaciones. No se cambiaron respuestas a éxito ni se eliminaron controles.
