# Runbook producción — NO AUTORIZADO

Estado: bloqueado por actas 47/48, alto riesgo abierto y falta de infraestructura verificada. No ejecutar este procedimiento ahora. No existe workflow que despliegue realmente.

Precondiciones: requisitos de PRODUCTION_READINESS_CHECKLIST.md, responsable designado, Fase 48 aceptada, staging verificado, presupuesto/proveedor/dominio autorizados, backup y restore probados, aprobación específica de publicación y ventana de mantenimiento.

Secuencia futura: congelar artefactos/digests/lock → comprobar compatibilidad de esquema/cliente offline → revisar respaldo y capacidad → obtener aprobación → configurar secretos externos sin imprimirlos → ejecutar migración autorizada con rol separado si procede → desplegar imagen inmutable con cierre controlado → smoke HTTPS, login de prueba autorizado, ámbito institucional, archivos/colas cuando existan → observar métricas/logs/errores → aprobar continuidad o revertir tráfico/imagen compatible.

No migración automática en cada arranque/commit; no downgrade o restauración encima de datos recientes por comodidad. Registrar versión, operador/aprobación, revisión DB, evidencia y decisión, sin contraseñas. Incidente o error de integridad: detener promoción, conservar datos y seguir DISASTER_RECOVERY/ROLLBACK_PLAN.

Prueba local de bloqueo ejecutada: `node infra/scripts/check-release-gate.cjs production` devuelve código 1 y condiciones pendientes. No equivale a mecanismo completo de aprobación organizacional.
