import { setupAuthForm } from '../core/auth-form.js';
import { registerAccount } from '../services/auth.service.js';

const form = document.querySelector('#register-form');
const status = document.querySelector('#form-status');
const options = form.querySelectorAll('[name="account-type"]');
function selectFlow() {
  const flow = form.querySelector('[name="account-type"]:checked').value;
  form.querySelectorAll('[data-account-flow]').forEach(section => {
    const active = section.dataset.accountFlow === flow;
    section.hidden = !active;
    section.disabled = !active;
    if (!active) {
      section.querySelectorAll('input').forEach(input => {
        input.removeAttribute('aria-invalid');
        if (input.autocomplete === 'new-password') input.type = 'password';
      });
      section.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; error.hidden = true; });
      section.querySelectorAll('[data-toggle-password]').forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `Mostrar ${button.dataset.togglePassword}`);
      });
    }
  });
  status.textContent = '';
}
options.forEach(option => option.addEventListener('change', selectFlow));
selectFlow();
setupAuthForm(form, data => registerAccount({
  // La modalidad seleccionada no concede un rol; el servidor resolverá la invitación.
  invitation: data.get('invitation') || data.get('classroom-code'),
  alias: data.get('school-alias'),
  name: data.get('teacher-name'),
  email: data.get('email'),
  password: data.get('password'),
}));
