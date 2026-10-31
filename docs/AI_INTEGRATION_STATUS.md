# EDUNEXT AI — integración Fase 47

> Continuación 2026-10-27: router AI importado en aplicación real, OpenAPI generado
> y frontera sin autenticación comprobada con ASGI (401). No se activó proveedor,
> audio o generación ni se validaron cuotas en PostgreSQL. Estado esencial sin cambio:
> capacidades generativas/voz bloqueadas. Ver informe de continuación.

Existe router AI, cliente ai-api, gateway y adaptador Ollama local según fuentes y documentación Fase 45. No se verificó daemon, modelo o proveedor en esta ejecución.

| Capacidad | Estado verificable aquí |
|---|---|
| Tutor | Endpoint/interfaz existentes; generación real no probada |
| Traducción | Integración inicial; generación real no probada |
| Diccionario | Recurso local existente; no equivale a traducción generativa |
| Pronunciación | Referencias; sin prueba de transcripción, TTS servidor o evaluación fonética |
| Cuotas/política | Implementación previa; no ejecutada con PostgreSQL aquí |

No se descargó modelo, habilitó proveedor, capturó audio ni produjo una respuesta simulada como real. Permanecen válidas las limitaciones de AI_KNOWN_LIMITATIONS.md. No se certifica aislamiento de contexto por una prueba HTTP simulada.
