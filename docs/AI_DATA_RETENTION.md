# Retención de IA

| Dato | Política implementada |
|---|---|
| Preguntas y respuestas | No persistidas en servidor; turno en memoria de petición |
| Conversaciones | Historial servidor deshabilitado |
| Traducciones/búsquedas | Sin historial servidor |
| Audio/transcripciones | No recibidos ni almacenados |
| Sesión de referencia | Expira en 1 día |
| AIUsageEvent | Expira en 30 días; sin texto ni audio |
| Configuración | Última política/revisión y actor; conservación operativa institucional |

Worker de lifespan elimina exclusivamente metadatos IA vencidos al arrancar y cada
AI_RETENTION_SWEEP_SECONDS (3600 s por defecto). Al apagar backend no hay worker;
tras reiniciar se retoma barrido. Puede haber demora hasta siguiente barrido.
Errores de barrido se registran sin detalle privado; el operador debe supervisarlos.

Comando manual complementario: `python -m scripts.purge_expired_ai_metadata`.
No fue ejecutado contra datos del usuario para producir evidencias ficticias;
la función se probó con datos aislados. No borra tablas académicas ni IndexedDB.

Las vistas API limpian texto al salir y recargan en restauración de bfcache para
revalidar sesión/contexto. No se persisten chats/traducciones en IndexedDB/Cache Storage.
La aplicación no controla backups, logs del daemon o copias externas: verificar
políticas del host. No se certifica eliminación de terceros ni cumplimiento legal.
