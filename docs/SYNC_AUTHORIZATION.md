# Autorización

Autenticación/sesiones revocables y CSRF existentes; no hay login offline nuevo.
Sync reutiliza permisos de progreso, sin añadir concesiones a roles.
Consulta institución/usuario activos, perfil real y ámbito académico mediante
ProgressService/AcademicAccessService. Filtros del repositorio de recibos siempre
incluyen institución y actor. Poseer un UUID no autoriza una consulta.

Los campos expected_* solo evitan enviar cola A usando sesión B: el servidor los
compara con contexto autenticado, nunca los usa para cambiar de cuenta/institución.
La UI y la cola no deciden permisos. Estos controles requieren pruebas reales
de dos instituciones, sesión revocada, traslado y cambios de permisos antes de activar.
