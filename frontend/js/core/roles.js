export const ROLES = Object.freeze({ STUDENT: 'STUDENT', MONITOR: 'MONITOR', ADMIN: 'ADMIN' });

export const ROLE_DETAILS = Object.freeze({
  STUDENT: Object.freeze({ label: 'Estudiante', destination: 'student/index.html' }),
  MONITOR: Object.freeze({ label: 'Monitor / Docente', destination: 'monitor/index.html' }),
  ADMIN: Object.freeze({ label: 'Administrador', destination: 'admin/index.html' }),
});

/** Valida el contrato, no demuestra que el origen de los roles sea confiable. */
export function normalizeRoles(roles) {
  if (!Array.isArray(roles) || roles.some(role => typeof role !== 'string' || !Object.hasOwn(ROLE_DETAILS, role))) {
    throw new TypeError('La lista de perfiles autorizados tiene un formato no válido.');
  }
  return [...new Set(roles)];
}
