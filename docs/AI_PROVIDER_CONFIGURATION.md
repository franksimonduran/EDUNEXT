# Proveedor: adaptador Ollama local, no habilitado en este entorno

Adenda: adaptador opcional `gemini_online` preparado y desactivado por defecto.
Ver [configuración privada y límites de Gemini](GEMINI_ONLINE_SETUP.md).
Las verificaciones históricas siguientes no acreditan Gemini operativo.

## Evaluación y documentación

Consultado el 2026-10-23:
- https://docs.ollama.com/api/chat
- https://docs.ollama.com/api/tags
- https://docs.ollama.com/faq

Se prioriza inferencia local por minimización de transferencias, API HTTP existente,
salida estructurada y posibilidad de limitar recursos. No se eligió por popularidad.
No se contrató proveedor cloud, no se instaló SDK ni se descargó ningún modelo.
La licencia del modelo concreto y su calidad infantil deben revisarse antes de elegirlo.
No existe un nombre/modelo predeterminado que aparente estar disponible.

## Configuración operativa requerida

Variables backend (ejemplos sin modelo ni credenciales reales en .env.example):
AITHRON_AI_ENABLED, AI_PROVIDER_CODE=ollama_local, AI_MODEL con etiqueta instalada
exacta, AI_OLLAMA_URL de loopback, AI_LOCAL_ONLY_ATTESTED, AI_TIMEOUT_SECONDS,
AI_MAX_INFLIGHT_PER_INSTITUTION y AI_MAX_OUTPUT_CHARACTERS.

Además la institución debe habilitar tutor/traducción y aprobar el proveedor mediante
su permiso de configuración. Cambiar una preferencia local no aplica esta política.

El operador debe verificar ejecución local real, licencia, seguridad del host y
calidad del modelo. Según FAQ, desactivar cloud en el daemon con OLLAMA_NO_CLOUD=1
o disable_ollama_cloud=true y reiniciarlo; restringir egreso de red según política.
AI_LOCAL_ONLY_ATTESTED es una declaración del operador, no una certificación automática.

El adaptador solo acepta HTTP de localhost/127.0.0.1/::1, sin credenciales en URL,
query, fragmento o rutas adicionales. No sigue redirects ni proxies de entorno.
Rechaza nombres cloud y entradas de /api/tags con remote_model/remote_host.
Verifica la etiqueta instalada antes de generar; nunca ejecuta pull, cloud o búsquedas.

## Protocolo y límites

POST /api/chat, stream=false, JSON schema de answer, sin tools, num_predict 32–512,
num_ctx 4096, keep_alive=0. Timeout total y de transporte configurable 1–60 s,
respuesta máxima 64 KiB, modelo/rol/done/unidades validados. No se devuelve thinking.
No hay reintentos automáticos; circuit breaker en memoria tras fallos de transporte,
con espera de 30 s. No coordina circuitos entre workers.

## Estado real y costos

La consulta a 127.0.0.1:11434/api/tags fue rechazada por conexión (10061). No se
verificó versión de daemon, modelo ni generación real. Runtime: not_configured_or_disabled.
Los contratos se probaron con httpx.MockTransport; eso no verifica calidad ni inferencia.
No hay tarifa API constatada ni medición de electricidad/hardware: costo null, no cero.

Para desactivar: quitar habilitación global o institucional. No se modificó .env del
usuario. Los proveedores externos con credenciales quedan pendientes de aprobación,
contratos/retención/entrenamiento/transferencias y adaptador específico; no se presentan activos.
