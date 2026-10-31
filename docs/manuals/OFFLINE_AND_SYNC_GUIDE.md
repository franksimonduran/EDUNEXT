# Offline y Sync — límites esenciales

**La sincronización confirmada y la separación de cuentas no están aceptadas. No usar con respuestas reales de estudiantes.** Hay IndexedDB, preparación local y SW; eso no prueba un protocolo de servidor.

| Estado que debe distinguirse | Significado seguro |
|---|---|
| Recurso preparado localmente | Solo bytes comprobados en este navegador; no matrícula/publicación nueva |
| Guardado local/provisional | No confirmado por PostgreSQL |
| Pendiente/enviando | No equivale a entregado; no cerrar como éxito por indicador de red |
| Confirmado | Solo cuando una API real y recibo válido lo acrediten; motor Sync no verificado aquí |
| Rechazado/conflicto | Conservar trabajo y solicitar resolución autorizada; no sobrescribir ni última escritura gana general |

## Ensayo futuro autorizado

Descargar paquete permitido/versionado → comprobar manifiesto y checksums → desconectar → abrir lección y responder actividad permitida → cerrar/reabrir → recuperar respuestas → reconectar → verificar cuenta/sesión/permisos → enviar con idempotencia → comprobar recibo/DB → actualizar estado. **No se ejecutó esta cadena completa.**

El SW restringe caches a activos públicos y ya no sirve HTML autenticado desde cachés viejas. El alcance verificado en VM permite abrir shells preparadas de `monitor/*.html`, `admin/*.html` y las páginas student `leccion`, `tutor`, `palabra`, `juego` y `ejercicio`; no incluye datos, audio, evaluaciones, tareas ni APIs. La preparación rechaza respuestas `private`/`no-store` y HTML fuera de la allowlist, y verifica cada activo referenciado antes de confirmarlo.

El centro de descargas `aithron-content-v1` no se consulta desde el SW y queda fuera de este alcance. No prometer disponibilidad offline de toda la app, Tutor generativo, evaluaciones o tareas. Un paquete parcial no debe marcarse instalado. La prueba de navegador real no está ejecutada si Playwright no está disponible; la validación VM no sustituye esa prueba.

## Problemas y equipos compartidos

No borrar IndexedDB, limpiar caches globales, reinstalar o eliminar pendientes para recuperar espacio. No reenviar repetidamente una entrega tras timeout sin consultar confirmación/idempotencia. Si ves datos ajenos, detén uso, protege pantalla y solicita al responsable designado; no copies esos datos. Cambio A→B→A sigue pendiente de prueba. No se eliminó trabajo para aparentar privacidad.
