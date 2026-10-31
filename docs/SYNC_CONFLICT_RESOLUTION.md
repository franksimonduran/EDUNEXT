# Conflictos y reintentos

- Versión de lección cambiada: conflicto; no migra ni descarta la operación.
- Mismo ID y contenido distinto: conflicto; no se reejecuta con datos diferentes.
- Contexto cuenta/institución cambiado: 409, sin reasignar trabajo.
- Matrícula/recurso/permiso inválido: rechazado; permanece local.
- SQL/red/503/429: reintentable. 401 bloquea autenticación, no equivale a sin Internet.

Cliente: máximo cinco envíos por operación, backoff exponencial con dispersión.
Una ejecución manual procesa hasta 25; falla red/sesión y se detiene. No hay
reintento automático infinito o Background Sync. sending tras cierre puede reintentarse
con el mismo ID. Web Locks obligatorio para enviar; sin soporte se bloquea el envío.

No hay resolución manual implementada para conflictos ni reinicio de presupuesto
desde UI. No se borra trabajo. No existe política última-escritura-gana genérica.
Prácticas/tareas/evaluaciones están fuera de este handler y no se reabren intentos.
