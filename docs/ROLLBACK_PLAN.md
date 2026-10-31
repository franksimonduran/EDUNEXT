# Rollback de aplicación y datos

No hay despliegue activo que revertir. Preparación: guardar digest de API/frontend, lock y configuración versionada no secreta; revisión DB y contratos compatibles, fuentes de secretos externas y evidencia de staging. Artefactos de build preparados no son release publicada.

Ante fallo: detener promoción y cambios nuevos → capturar errores técnicos sin datos personales → evaluar integridad → decidir reencaminar tráfico o volver a imagen previa **compatible con esquema actual** → verificar health/login/tenant/entregas/cliente offline → observar y registrar decisión.

No ejecutar alembic downgrade como parte automática de rollback. Una migración expansiva compatible puede permanecer; cambios destructivos requieren estrategia específica y aprobación. Restauración de datos es recuperación distinta, a nueva base y con reconciliación de escrituras posteriores. No borrar respuestas/IDB/caches para ocultar incompatibilidades.

PWA: no imponer limpieza global; soportar cliente anterior y contenidos versionados según contrato existente. Compatibilidad de Sync antiguo y nuevos esquemas no acreditada; mantener módulo deshabilitado. Fallos de seguridad/integridad bloquean reabrir uso real aunque vuelva a responder HTTP 200.
