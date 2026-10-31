import { config } from '../core/config.js';

// Validación de la entrada del traductor. El texto se trata siempre como
// contenido y se escapa al presentarse; nunca se interpreta como HTML.
export function validateTranslationInput(value, from, to) {
 const text = String(value ?? '').trim();
 if (!text) return { valid: false, error: 'empty', text: '' };
 if (text.length > config.translator.maxInputLength) return { valid: false, error: 'tooLong', text };
 if (from === to) return { valid: false, error: 'sameLanguage', text };
 return { valid: true, text };
}
