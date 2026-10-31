import { icon } from './icons.js';
import { translatorLanguages } from '../data/languages.data.js';
import { languageName, languageEndonym } from '../utils/language-format.js';
import { escapeHTML as esc } from './student-ui.js';

// Selector de idioma accesible. Identifica el idioma por su nombre y endónimo,
// nunca por banderas. `id` y `label` permiten textos con i18n.
export function renderLanguageSelector({ id, value, label, disabled = false, exclude = [] }) {
 const options = translatorLanguages
  .filter(language => !exclude.includes(language.code))
  .map(language => `<option value="${language.code}" ${language.code === value ? 'selected' : ''} lang="${language.tag}">${esc(languageName(language.code))} · ${esc(languageEndonym(language.code))}</option>`)
  .join('');
 return `<label class="language-selector" for="${id}"><span class="sr-only">${esc(label)}</span>${icon('globe')}<select id="${id}" ${disabled ? 'disabled' : ''} aria-label="${esc(label)}">${options}</select></label>`;
}
