import { config } from './config.js';
import { normalizeRoles, ROLE_DETAILS } from './roles.js';
import { getAuthorizedSession } from '../services/auth.service.js';

/**
 * Resolución pura de navegación, sin conceder permisos ni efectuar redirecciones.
 * En producción, roles debe proceder exclusivamente de la sesión del servidor.
 */
export function resolveRoleNavigation(roles, requestedRole) {
  const authorized = normalizeRoles(roles);
  if (authorized.length === 0 || (requestedRole !== undefined && !authorized.includes(requestedRole))) {
    return { kind: 'unauthorized', destination: config.routes.unauthorized };
  }
  if (requestedRole === undefined && authorized.length > 1) {
    return { kind: 'selection', roles: authorized, destination: config.routes.roles };
  }
  const role = requestedRole ?? authorized[0];
  return { kind: 'module', role, destination: ROLE_DETAILS[role].destination };
}

/**
 * Única entrada preparada para redirecciones autenticadas. Nunca recibe una
 * sesión del llamador: consulta el servicio y comprueba pertenencia antes de navegar.
 * No se usa desde la demostración. El backend deberá proteger todos los destinos.
 */
export async function navigateAuthenticated(requestedRole) {
  const session = await getAuthorizedSession();
  if (!session || session.authenticated !== true) {
    window.location.assign(config.routes.login);
    return { kind: 'login' };
  }
  const resolution = resolveRoleNavigation(session.roles, requestedRole);
  if (resolution.kind === 'module' && !config.roleModulesReady) {
    return { kind: 'unavailable', role: resolution.role };
  }
  window.location.assign(resolution.destination);
  return resolution;
}
