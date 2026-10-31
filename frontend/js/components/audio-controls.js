import { icon } from './icons.js';
import { ts } from '../student/translator-i18n.js';
import { escapeHTML as esc } from './student-ui.js';

// Controles de reproducción reutilizables. `target` es un identificador lógico que
// el controlador usa para saber qué texto leer. Los botones solo aparecen cuando el
// texto existe; el controlador deshabilita los no soportados.
export function renderAudioControls({ target, lang, label, variant = 'inline' }) {
 return `<div class="audio-controls audio-controls--${variant}" role="group" aria-label="${esc(label)}">
  <button type="button" class="icon-text-button" data-speak="${esc(target)}" data-speak-lang="${esc(lang)}" data-speak-rate="normal">${icon('speaker')}<span>${ts('listen')}</span></button>
  <button type="button" class="icon-text-button" data-speak="${esc(target)}" data-speak-lang="${esc(lang)}" data-speak-rate="slow">${icon('slow')}<span>${ts('listenSlow')}</span></button>
  <button type="button" class="icon-text-button" data-speak-stop hidden>${icon('close')}<span>${ts('stop')}</span></button>
 </div>`;
}

// Actualiza el estado visual de un grupo de controles dentro de `scope`.
// `state = { status, target }`; solo marca el botón que inició la reproducción.
export function setAudioState(scope, state = {}) {
 const group = scope.querySelector?.('.audio-controls');
 if (!group) return;
 const playing = state.status === 'speaking';
 group.querySelectorAll('[data-speak-rate]').forEach(button => {
  button.classList.toggle('is-playing', playing && button.dataset.speak === state.target && button.dataset.speakRate === state.rate);
 });
 const stopButton = group.querySelector('[data-speak-stop]');
 if (stopButton) stopButton.hidden = !playing;
}
