import { setupAuthForm } from '../core/auth-form.js';
import { requestPasswordRecovery } from '../services/auth.service.js';

setupAuthForm(document.querySelector('#recovery-form'), data => requestPasswordRecovery({ email: data.get('email') }));
