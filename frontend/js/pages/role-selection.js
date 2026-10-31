import { config } from '../core/config.js';
import { ROLE_DETAILS, normalizeRoles } from '../core/roles.js';
import { getAuthorizedSession, AuthenticationUnavailableError } from '../services/auth.service.js';

const cards = [...document.querySelectorAll('.role-card')];
const grid = document.querySelector('.role-grid');
const status = document.querySelector('#role-status');
const error = document.querySelector('#role-error');
const errorMessage = document.querySelector('#role-error-message');
const denied = document.querySelector('#role-denied');
const retry = document.querySelector('#retry-preview');
let authorizedRoles = [];
let busy = false;
let loading = true;

function render() {
  cards.forEach(card => {
    const role = card.dataset.role;
    const available = authorizedRoles.includes(role);
    const button = card.querySelector('button');
    card.dataset.disabled = String(!available);
    card.dataset.selected = 'false';
    button.disabled = !available || busy || loading;
    button.setAttribute('aria-pressed', 'false');
    card.querySelector('.role-state').textContent = available
      ? 'Perfil habilitado para tu cuenta'
      : 'No asignado a tu cuenta';
  });
}

function showError(message) {
  errorMessage.textContent = message;
  error.hidden = false;
  denied.hidden = true;
  status.dataset.state = 'error';
  status.textContent = '';
}

async function loadProfiles() {
  loading = true;
  busy = false;
  error.hidden = true;
  denied.hidden = true;
  status.dataset.state = 'normal';
  status.textContent = 'Comprobando tu sesión…';
  grid.setAttribute('aria-busy', 'true');
  authorizedRoles = [];
  render();

  try {
    const session = await getAuthorizedSession();
    if (!session) {
      window.location.replace(config.routes.login);
      return;
    }
    authorizedRoles = normalizeRoles(session.roles);
    if (authorizedRoles.length === 0) {
      denied.hidden = false;
      status.dataset.state = 'denied';
      status.textContent = '';
    } else {
      status.textContent = 'Elige el perfil con el que deseas continuar.';
    }
  } catch (exception) {
    showError(exception instanceof AuthenticationUnavailableError
      ? exception.message
      : 'No se pudieron cargar tus perfiles. Inténtalo de nuevo.');
  } finally {
    loading = false;
    grid.setAttribute('aria-busy', 'false');
    render();
  }
}

cards.forEach(card => {
  card.querySelector('button').addEventListener('click', async () => {
    if (busy || loading) return;
    const role = card.dataset.role;
    if (!authorizedRoles.includes(role) || !Object.hasOwn(ROLE_DETAILS, role)) {
      status.dataset.state = 'denied';
      status.textContent = 'Este perfil no está asignado a tu cuenta.';
      return;
    }
    busy = true;
    grid.setAttribute('aria-busy', 'true');
    status.dataset.state = 'normal';
    status.textContent = `Abriendo ${ROLE_DETAILS[role].label}…`;
    render();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.location.assign(ROLE_DETAILS[role].destination);
  });
});

retry.addEventListener('click', loadProfiles);
loadProfiles();
