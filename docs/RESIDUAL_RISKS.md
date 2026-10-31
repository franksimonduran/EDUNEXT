# Riesgos residuales y decisión

## Estado actualizado 2026-10-27

Mitigados con pruebas focales: cota/expiración/exclusión del limiter local, truncado
por upload sobredimensionado, reemplazo interrumpido, rutas Windows y omisión de
claims JWT. No equivalen a sistema completo validado ni cierre de altos anteriores.

Abiertos: avisos python-jose/ecdsa sin fix_version consultada, limiter distribuido y
agotamiento de capacidad, autorización granular/tenant y sesiones reales, integridad
académica/entregas concurrentes, IDB compartido/cachés heredadas, archivos/symlinks
bajo host hostil y funcionalidades de almacenamiento aún bloqueadas.

Medido solo smoke health ASGI y función limiter; siguen sin evaluar carga de negocio,
PostgreSQL, backup/restore, RPO/RTO, Web Vitals, calidad de AI habilitada o accesibilidad
integral. SBOM/SCA nuevos cubren un venv, no todo el suministro/licencias/despliegues.
No hay aceptación explícita de riesgos ni permiso de uso real. Gate permanece cerrado.

## Registro histórico

## Mitigado con evidencia limitada

- Política SW insegura: VM pasa; navegador real con caché/actualización/cuentas no probado. Caches antiguas no borradas, otros lectores locales pendientes.
- Cliente timeout y carrera de sesión: fixture/simulación pasan; server cookies, múltiples pestañas y revocación real pendientes.

## Cambios aplicados, sin validación runtime

Controles parent-course institucional, bloqueo refresh, validador de producción, logs/no-store API, rechazo de almacenamiento ficticio, detección de archivo y dependencia EmailStr. **No cerrar hallazgos altos** hasta ejecutar Python/BD/HTTP y revisión independiente.

## Abiertos/bloqueantes

Autorización granular/publicación en todos los módulos, aislamiento entre dos instituciones, pérdida/doble entrega, offline compartido, límites de multipart/memoria, rate limiter por proceso y sin cota, Fase 47 incompleta, evaluaciones/Insights/Sync completos ausentes o parciales.

No medidos capacidad, consultas, resiliencia DB/backups, RPO/RTO ni calidad pedagógica/seguridad semántica AI. Accesibilidad/compatibilidad solo login público. SCA/secret scan/SBOM y licencias incompletos.

Mitigación temporal: no habilitar uso con datos privados/menores ni exponer públicamente; mantener módulos no operativos indisponibles, conservar datos locales y no confirmar resultados simulados. No se presume aceptación de riesgos por el usuario. Necesita tratamiento y revisión explícita responsable.
