import { signIn, AuthenticationUnavailableError, AuthenticationError } from '../services/auth.service.js';
import { resolveRoleNavigation } from '../core/navigation.js';

const form = document.querySelector('#login-form');
const identifier = document.querySelector('#identifier');
const password = document.querySelector('#password');
const toggle = document.querySelector('#password-toggle');
const submit = document.querySelector('#submit-button');
const label = document.querySelector('#submit-label');
const spinner = document.querySelector('#submit-spinner');
const arrow = document.querySelector('#submit-arrow');
const status = document.querySelector('#form-status');
let submitting = false;

function validate(field) {
  let message = '';
  if (!field.value.trim()) {
    message = field === identifier ? 'Ingresa tu correo o nombre de usuario.' : 'Ingresa tu contraseña.';
  } else if (field === identifier && field.value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
    message = 'Ingresa un correo válido, por ejemplo: nombre@colegio.edu.';
  }
  const error = document.querySelector(`#${field.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

for (const field of [identifier, password]) {
  field.addEventListener('blur', () => validate(field));
  field.addEventListener('input', () => {
    status.textContent = '';
    if (field.hasAttribute('aria-invalid')) validate(field);
  });
}

toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-pressed', String(visible));
  toggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

function setLoading(loading) {
  submitting = loading;
  submit.disabled = loading;
  form.setAttribute('aria-busy', String(loading));
  spinner.hidden = !loading;
  arrow.hidden = loading;
  label.textContent = loading ? 'Comprobando disponibilidad…' : 'Iniciar sesión';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitting) return;
  status.textContent = '';
  const validity = [identifier, password].map(field => validate(field));
  if (validity.includes(false)) {
    [identifier, password][validity.indexOf(false)].focus();
    return;
  }
  setLoading(true);
  try {
    const session = await signIn({ identifier: identifier.value.trim(), password: password.value });
    const navigation = resolveRoleNavigation(session.roles);
    if (navigation.kind === 'module' || navigation.kind === 'selection') {
      status.textContent = 'Sesión iniciada. Redirigiendo…';
      window.location.assign(navigation.destination);
      return;
    }
    status.textContent = 'Tu cuenta no tiene un perfil habilitado. Contacta a la institución.';
  } catch (error) {
    if (error instanceof AuthenticationError) {
      status.textContent = error.status === 401
        ? 'Usuario o contraseña incorrectos.'
        : error.status === 429
          ? 'Demasiados intentos. Espera un momento antes de volver a intentarlo.'
          : error.message;
    } else if (error instanceof AuthenticationUnavailableError) {
      status.textContent = error.message;
    } else {
      status.textContent = 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.';
    }
  } finally {
    setLoading(false);
  }
});

submit.disabled = false;
