# Hallazgos de seguridad e integración

## Continuación 2026-10-27

| Hallazgo | Cambio | Verificación / límite |
|---|---|---|
| Dependencias runtime omitidas | SQLAlchemy extra asyncio + aiofiles declarados | Imports/contratos/ASGI pasan en venv nuevo; sin SCA/lock certificado |
| Dos rutas de asociación de recursos duplicadas | Conservado handler ya efectivo de lessons.router; retirados registros de educational_resources | Regresión recorre routers incluidos y comprueba OpenAPI sin IDs duplicados; sin escritura DB |
| Vista privada podía permanecer tras inicio de logout | Hook de invalidación síncrona; reportes/Insights/Sync desmontan contenido | Transporte/DOM dobles, incluso respuesta tardía; cookies/revocación y dos cuentas reales pendientes |
| Insights sin consumidor visual | Vista reutilizada con escape, permisos Reports y estados explícitos | Contratos, pruebas de salida/403 y carrera con dobles; sin E2E PostgreSQL |

No se cierran los hallazgos altos del registro de vulnerabilidades por estas pruebas.
No hay autorización para piloto o producción. Registro histórico a continuación.

| Hallazgo | Impacto/prioridad | Cambio | Evidencia / pendiente |
|---|---|---|---|
| pytest drop_all en URL configurable sin opt-in | Alta: destrucción accidental | Requiere URL explícita _test y confirmación de nombre antes de imports de aplicación | Fuente revisada; Python no ejecutado; operador aún debe garantizar base desechable |
| Refresh concurrente dentro de pestaña | Alta: rotación conflictiva | Promesa única de renovación | Test simulado de 10 llamadas pasa; múltiples pestañas pendientes |
| Login fabricaba contexto tras fallo de /me | Alta: UX autenticada no verificada | Propaga fallo; no sintetiza contexto | Test 403 pasa; RBAC servidor no cambiado |
| Errores y fetch sin plazo | Media: estados ambiguos/espera indefinida | Mensajes por estado, validación, timeout y signal | Test simulado pasa; cuerpo lento no cubierto por timeout |
| Caché compartida/uso multiusuario | Alta pendiente de análisis | No se purgaron datos ni reemplazó SW | No hay prueba de aislamiento; requiere revisión antes de uso privado |
| Logout vs refresh/solicitudes en vuelo | Alta pendiente | No corregido ni certificado | Requiere cancelación/contexto de cuenta y prueba real |
| Guardas/menús de todas las páginas | Alta pendiente | Inventario de referencias solamente | No demuestra protección de UI completa |

No se hicieron pruebas de penetración ni se declara seguridad total. No se publicaron secretos, audios o datos personales. No se alteraron AD/A/B/C ni permisos para eludir fallos. Auditoría exhaustiva reservada para Fase 48 después de resolver bloqueos de integración.
