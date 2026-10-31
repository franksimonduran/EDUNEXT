import { config } from './config.js';
import { AuthenticationUnavailableError } from '../services/auth.service.js';

export function passwordRules(value) {
  const policy = config.password;
  return [
    { text: `Al menos ${policy.minLength} caracteres`, met: value.length >= policy.minLength },
    ...(policy.requireLetter ? [{ text: 'Una letra como mínimo', met: /\p{L}/u.test(value) }] : []),
    ...(policy.requireNumber ? [{ text: 'Un número como mínimo', met: /\d/.test(value) }] : []),
  ];
}

/** Validación y estados compartidos. Las credenciales solo viven en el formulario. */
export function setupAuthForm(form, operation) {
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.querySelector('[data-submit-label]');
  const spinner = submit.querySelector('.spinner');
  const normalLabel = submitLabel.textContent;
  let busy = false;
  const fields = () => [...form.querySelectorAll('input')].filter(input => !input.matches(':disabled') && input.type !== 'radio');

  function validate(field) {
    let message = '';
    if (field.required && !field.value.trim()) message = 'Completa este campo.';
    else if (field.type === 'email' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()) || field.validity.typeMismatch)) message = 'Ingresa un correo institucional válido.';
    else if (field.dataset.passwordPolicy !== undefined && passwordRules(field.value).some(rule => !rule.met)) message = 'La contraseña debe cumplir todos los requisitos indicados.';
    else if (field.dataset.confirm && field.value !== document.getElementById(field.dataset.confirm).value) message = 'Las contraseñas no coinciden.';
    const error = document.getElementById(`${field.id}-error`);
    error.textContent = message;
    error.hidden = !message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  form.querySelectorAll('input:not([type="radio"])').forEach(field => {
    field.addEventListener('blur', () => { if (!field.matches(':disabled')) validate(field); });
    field.addEventListener('input', () => {
      status.textContent = '';
      if (field.hasAttribute('aria-invalid')) validate(field);
      form.querySelectorAll('[data-confirm]').forEach(confirm => {
        if (!confirm.matches(':disabled') && confirm.dataset.confirm === field.id && confirm.hasAttribute('aria-invalid')) validate(confirm);
      });
    });
  });

  form.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const field = document.getElementById(button.getAttribute('aria-controls'));
      const visible = field.type === 'password';
      field.type = visible ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', `${visible ? 'Ocultar' : 'Mostrar'} ${button.dataset.togglePassword}`);
    });
  });

  form.querySelectorAll('[data-password-policy]').forEach(field => {
    const list = document.getElementById(field.dataset.requirements);
    const update = () => list.replaceChildren(...passwordRules(field.value).map(rule => {
      const item = document.createElement('li');
      item.dataset.met = String(rule.met);
      item.textContent = `${rule.text}${rule.met ? ' — cumplido' : ' — pendiente'}`;
      return item;
    }));
    field.addEventListener('input', update);
    update();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    status.textContent = '';
    const invalid = fields().filter(field => !validate(field));
    if (invalid.length) { invalid[0].focus(); return; }
    busy = true;
    submit.disabled = true;
    submit.dataset.loading = '';
    spinner.hidden = false;
    submitLabel.textContent = 'Comprobando disponibilidad…';
    form.setAttribute('aria-busy', 'true');
    // Deshabilita también el selector de flujo mientras se procesa el envío.
    const options = [...form.querySelectorAll('[name="account-type"]')];
    options.forEach(option => { option.disabled = true; });
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await operation(new FormData(form));
    } catch (error) {
      status.textContent = error instanceof AuthenticationUnavailableError ? error.message : 'La función no está disponible. Inténtalo de nuevo más tarde.';
    } finally {
      busy = false;
      submit.disabled = false;
      delete submit.dataset.loading;
      spinner.hidden = true;
      submitLabel.textContent = normalLabel;
      form.setAttribute('aria-busy', 'false');
      options.forEach(option => { option.disabled = false; });
    }
  });
  submit.disabled = false;
}
