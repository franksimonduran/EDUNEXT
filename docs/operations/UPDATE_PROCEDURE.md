# Actualizaciones y congelación

La versión de producto sigue 0.1.0. Candidato interno 0.1.0-validation.1: no release/tag Git ni aceptación. Hashes al final del proceso, sin empaquetar secretos/DB. `node tools/final-inventory.cjs --verify` comprueba corpus y evidencia congelada, no seguridad/funcionalidad.

Durante validación solo defectos/seguridad/accesibilidad/integridad/docs indispensables. Cada cambio posterior invalida candidato o requiere versión candidata nueva explícita: no sobrescribir silenciosamente manifiesto/baseline. Repetir pruebas afectadas, aprobación y gates antes de promover. No release público sin autorización.

Reusar infraestructura 49, migraciones revisadas y rollback de código compatible; datos son recuperación separada. Actualizar PWA sin purgar IDB/pendientes o reasignar versiones históricas. Compatibilidad cliente/Sync vieja sin verificar bloquea habilitación; no borrar operaciones para aparentar actualización correcta.
