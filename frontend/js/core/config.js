// Public, non-secret runtime configuration supplied before module loading.
// EDUNEXT public configuration; retain the legacy alias for existing hosts.
const apiBaseUrl = globalThis.EDUNEXT_CONFIG?.apiBaseUrl ?? globalThis.AITHRON_CONFIG?.apiBaseUrl ?? '/api/v1';
if (typeof apiBaseUrl !== 'string' || !apiBaseUrl || apiBaseUrl.startsWith('//')) {
  throw new TypeError('Configuración pública de API no válida.');
}
export const config = Object.freeze({
  locale: 'es',
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
  csrfHeaderName: 'X-CSRF-Token',
  routes: Object.freeze({ login: 'login.html', register: 'register.html', recovery: 'forgot-password.html', reset: 'reset-password.html', roles: 'role-selection.html', unauthorized: 'unauthorized.html' }),
  roleModulesReady: true,
  password: Object.freeze({ minLength: 10, requireLetter: true, requireNumber: true }),
  tutor: Object.freeze({ maxInputLength: 1000, maxConversations: 10, maxMessages: 80 }),
  translator: Object.freeze({ maxInputLength: 300, maxVocabulary: 60 }),
  speech: Object.freeze({ defaultRate: 1, slowRate: 0.6 }),
});
