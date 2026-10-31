import { config } from '../core/config.js';

const STORAGE_KEYS = Object.freeze({
  accessToken: 'aithron.access_token',
  csrfToken: 'aithron.csrf_token',
});

const memory = { accessToken: null, csrfToken: null };
let refreshPromise = null;
let sessionEpoch = 0;
const authenticationClearedListeners = new Set();

// Private views can unmount synchronously on logout/login change without deleting drafts.
export function onAuthenticationCleared(listener) {
  if (typeof listener !== 'function') throw new TypeError('Se requiere una función de limpieza.');
  authenticationClearedListeners.add(listener);
  return () => authenticationClearedListeners.delete(listener);
}

export class AuthenticationUnavailableError extends Error {
  constructor(message = 'No se pudo contactar con el servicio de autenticación. Revisa tu conexión e inténtalo de nuevo.') {
    super(message);
    this.name = 'AuthenticationUnavailableError';
  }
}

export class AuthenticationError extends Error {
  constructor(message, status = 0, code = 'AUTHENTICATION_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.status = status;
    this.code = code;
  }
}

function readStored(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // sessionStorage can be unavailable in private browsing; memory is the fallback.
  }
}

function getAccessToken() {
  return memory.accessToken ?? readStored(STORAGE_KEYS.accessToken);
}

function getCsrfToken() {
  return memory.csrfToken ?? readStored(STORAGE_KEYS.csrfToken);
}

function storeTokens(payload) {
  memory.accessToken = payload.access_token ?? null;
  memory.csrfToken = payload.csrf_token ?? memory.csrfToken;
  writeStored(STORAGE_KEYS.accessToken, memory.accessToken);
  writeStored(STORAGE_KEYS.csrfToken, memory.csrfToken);
}

function clearTokens() {
  memory.accessToken = null;
  memory.csrfToken = null;
  writeStored(STORAGE_KEYS.accessToken, null);
  writeStored(STORAGE_KEYS.csrfToken, null);
  for (const listener of [...authenticationClearedListeners]) {
    try { listener(); } catch { /* One view cannot prevent session cleanup. */ }
  }
}

function buildUrl(path) {
  return `${config.apiBaseUrl}${path}`;
}

async function parseResponse(response, text) {
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const detail = payload?.detail;
    const messages = { 401: 'Tu sesión ha vencido. Inicia sesión de nuevo.', 403: 'No tienes permiso para esta operación.', 404: 'El recurso no está disponible.', 409: 'La operación entra en conflicto con el estado actual.', 422: 'Revisa los campos del formulario.', 429: 'Has alcanzado el límite de solicitudes. Espera antes de reintentar.', 500: 'El servidor no pudo completar la operación.', 503: 'El servicio no está disponible temporalmente.' };
    const message = typeof detail === 'string'
      ? detail
      : messages[response.status] ?? 'No se pudo completar la operación. Inténtalo de nuevo.';
    const error = new AuthenticationError(message, response.status, payload?.code ?? 'REQUEST_FAILED');
    error.fields = Array.isArray(detail) ? detail : [];
    error.retryAfter = response.headers.get('Retry-After');
    error.requestId = response.headers.get('X-Request-ID');
    throw error;
  }

  return payload;
}

async function request(path, { method = 'GET', body, auth = true, csrf = false, retry = true, headers: extraHeaders, responseType = 'json', signal, timeoutMs = 30000 } = {}) {
  const requestEpoch = sessionEpoch;
  const headers = { Accept: 'application/json', ...extraHeaders };
  const accessToken = getAccessToken();
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (csrf) {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers[config.csrfHeaderName] = csrfToken;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  let responseBody;
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    responseBody = response.ok && responseType === 'blob'
      ? await response.blob()
      : await response.text();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (controller.signal.aborted) throw new AuthenticationError('La solicitud agotó el tiempo de espera.', 0, 'TIMEOUT');
    throw new AuthenticationUnavailableError();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }

  if (requestEpoch !== sessionEpoch) {
    throw new AuthenticationError('El contexto de sesión ha cambiado.', 401, 'SESSION_CHANGED');
  }
  if (response.status === 401 && auth && retry && path !== '/auth/refresh') {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(path, { method, body, auth, csrf, retry: false, headers: extraHeaders, responseType, signal, timeoutMs });
    }
  }

   if(response.ok && responseType==='blob')return responseBody;
  return parseResponse(response, responseBody);
}

export function apiRequest(path, options = {}) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new TypeError('La ruta de la API debe ser relativa al servicio configurado.');
  }
  return request(path, options);
}

export function apiDownload(path, body) {
  return apiRequest(path,{method:'POST',body,responseType:'blob'});
}

function normalizeSession(payload) {
  return {
    authenticated: true,
    user: payload.user,
    institution: payload.institution,
    roles: payload.roles ?? payload.user?.roles ?? [],
    permissions: payload.permissions ?? [],
    sessionId: payload.session_id ?? null,
  };
}

async function fetchCsrfToken() {
  const payload = await request('/auth/csrf', { auth: false, retry: false });
  if (payload?.csrf_token) {
    memory.csrfToken = payload.csrf_token;
    writeStored(STORAGE_KEYS.csrfToken, payload.csrf_token);
  }
  return payload?.csrf_token ?? null;
}

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = renewSession().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function renewSession() {
  const renewalEpoch = sessionEpoch;
  if (!getCsrfToken()) {
    try {
      await fetchCsrfToken();
    } catch {
      if (renewalEpoch === sessionEpoch) clearTokens();
      return false;
    }
  }

  try {
    const payload = await request('/auth/refresh', {
      method: 'POST',
      auth: false,
      csrf: true,
      retry: false,
    });
    if (renewalEpoch !== sessionEpoch) return false;
    storeTokens(payload);
    return true;
  } catch (error) {
    if (renewalEpoch !== sessionEpoch) return false;
    if (error instanceof AuthenticationError && [401, 403].includes(error.status)) {
      clearTokens();
      return false;
    }
    throw error;
  }
}

export async function signIn({ identifier, password } = {}) {
  if (!identifier || !password) {
    throw new TypeError('Se requieren el identificador y la contraseña.');
  }

  sessionEpoch += 1;
  clearTokens();
  const payload = await request('/auth/login', {
    method: 'POST',
    body: { identifier, password },
    auth: false,
    retry: false,
  });
  storeTokens(payload);

  return getAuthorizedSession();
}

export async function getAuthorizedSession() {
  if (!getAccessToken()) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearTokens();
      return null;
    }
  }

  try {
    const payload = await request('/auth/me', { retry: false });
    return normalizeSession(payload);
  } catch (error) {
    if (error instanceof AuthenticationError && error.status === 401 && error.code !== 'SESSION_CHANGED') {
      const refreshed = await refreshSession();
      if (refreshed) {
        const payload = await request('/auth/me', { retry: false });
        return normalizeSession(payload);
      }
      clearTokens();
      return null;
    }
    throw error;
  }
}

export async function signOut() {
  sessionEpoch += 1;
  // Clear private presentation immediately, not after a slow logout request.
  for (const listener of [...authenticationClearedListeners]) {
    try { listener(); } catch { /* Continue server revocation. */ }
  }
  try {
    // Let an already rotating cookie settle before revoking its server session.
    if (refreshPromise) {
      try { await refreshPromise; } catch { /* Still attempt revocation. */ }
    }
    if (!getAccessToken()) await refreshSession();
    if (getAccessToken()) {
      await request('/auth/logout', { method: 'POST', csrf: true });
    }
  } finally {
    clearTokens();
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  return request('/auth/change-password', {
    method: 'POST',
    csrf: true,
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

// La recuperación de cuentas todavía no está expuesta por la API.
export async function registerAccount() {
  throw new AuthenticationUnavailableError('La creación de cuentas requiere una invitación emitida por la institución.');
}

export async function requestPasswordRecovery() {
  throw new AuthenticationUnavailableError('La recuperación de contraseñas todavía no está disponible.');
}

export async function resetPassword() {
  throw new AuthenticationUnavailableError('La recuperación de contraseñas todavía no está disponible.');
}
