import { setupAuthForm } from '../core/auth-form.js';
import { resetPassword } from '../services/auth.service.js';

// Esta pantalla no interpreta parámetros de URL ni los considera una autorización.
setupAuthForm(document.querySelector('#reset-form'), data => resetPassword({ password: data.get('password') }));
