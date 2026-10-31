# Incidencias/riesgos finales y control de cambios

| ID | Prioridad / alcance | Estado y siguiente acción |
|---|---|---|
| F50-01 | Alta bloqueante / flujo real | Python/DB/E2E ausentes; configurar entorno sintético y probar auth, sesiones, entrega/persistencia/progreso/reportes |
| F50-02 | Alta / autorización-tenant | Mantener A48-01/08 abiertos hasta prueba horizontal/vertical/dos instituciones; verificar publicación/asignación por recurso |
| F50-03 | Alta / académico | Evaluaciones/competencias/historial completos sin aceptación; no uso escolar ni conversión AD/A/B/C |
| F50-04 | Alta / motores ausentes | Insights y Sync servidor no implementados verificables; no simulación durante cierre |
| F50-05 | Media con funciones deshabilitadas / AI | Modelo/voz/seguridad semántica y revisión pedagógica no verificados; no habilitar sin aprobación |
| F50-06 | Alta / offline privado | Sin prueba de persistencia/paquete/recibos/A-B-A; conservar pendientes y suspender uso privado |
| F50-07 | Alta / infraestructura-recuperación | Lock/build/staging/HTTPS/backup/restore/soporte no verificados; scripts no sustituyen operación |
| F50-08 | Bloqueante / autorizaciones-humanos | Institución, responsables, base legal, pedagogía/licencias y piloto sin aprobación; no uso real o release público |
| F50-09 | Baja / calidad de prueba | Snapshot podía preceder load actual (Navigation Timing 0 observado); se exige loaderId/load y repetición del navegador final |

F50-09 es corrección del test, no de una fuga o funcionalidad académica. No se cerró defecto de aplicación solo por documentación. Registro A48-01…13 permanece vigente; sus severidades son contextuales, no certificación CVSS. No críticos nuevos demostrados con datos reales; ausencia de evidencia esencial impide garantizar ausencia de críticos.

No cambios funcionales nuevos, migraciones, notas, colas o roles durante cierre. Mejoras posteriores en MAINTENANCE_PLAN; responsable de cada aceptación por asignar, sin riesgo alto aceptado automáticamente.
