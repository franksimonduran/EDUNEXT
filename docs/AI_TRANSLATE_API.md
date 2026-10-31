# Traducción contextual y vocabulario son capacidades distintas

POST /api/v1/ai/translate: texto 1–1000 caracteres, origen/destino declarados es/en
distintos e Idempotency-Key UUID. Exige permiso de traducción, política aplicada y
modelo local operativo. Sin detección automática ni parámetros libres de generación.

El adaptador utiliza generación estructurada con instrucciones de traducción,
no concatenación de equivalencias. El texto traducido sigue no verificado.
Respuesta incluye idiomas declarados, detected_language=null, origen local_model,
advertencia y referencia técnica. No se guarda historial de traducciones.

Actualmente generación real no disponible. La UI deshabilita traducir y mantiene
la consulta de vocabulario separada cuando está autorizada. Un fallo no se sustituye
por una frase prefabricada. Cargar un enlace con una palabra no inicia inferencia.

Diccionario: recurso curado del proyecto, cobertura limitada, sin generación.
Modo API requiere conexión al backend incluso para consultar ese recurso local.
El modo demo/local previo se conserva explícitamente, sin llamarlo traducción IA offline.
Otros idiomas, detección, favoritos servidor, evaluación lingüística y motor offline
de traducción permanecen pendientes.
