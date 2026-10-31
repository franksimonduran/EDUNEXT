# Logs y observabilidad

SafeJSONFormatter reutiliza el módulo existente. Campos permitidos: timestamp UTC, nivel, servicio, entorno, evento técnico y request_id/método/ruta de contrato/status/duración/error_type cuando existan. Mensajes arbitrarios, stack traces, locals, rutas crudas y cuerpos no se serializan. Uvicorn se encamina al formatter tras setup; no se afirma cobertura de errores previos a inicialización o del proveedor externo.

Se eliminó la doble emisión de Request completed entre middleware de ID y logging para no duplicar conteos. Duración usa perf_counter. Request ID ya acotado en Fase 48; no es token de sesión. Nginx usa log técnico sin URL, query, cookies o IP en access log; error logs y plataforma aún requieren revisión de privacidad.

Docker local propone json-file max-size=10m/max-file=3 por contenedor. Es rotación por tamaño, no política temporal de datos personales ni backup. Retención temporal del colector, región, cifrado, acceso y eliminación: pendiente de aprobación. No guardar logs operativos en Git/artifacts públicos.

No se ejecutó FastAPI/Docker ni se validó captura JSON real aquí. Existe test Python de omisión de secreto fixture/ruta, escrito no ejecutado. No nuevos IDs personales ni etiquetas de alta cardinalidad en métricas. Correlación frontend usa X-Request-ID; CORS lo expone conforme a configuración existente.
