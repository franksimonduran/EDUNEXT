import { escapeHTML as esc } from './student-ui.js';
import { icon } from './icons.js';

export function renderPronunciationFeedback({ mode = 'info', text } = {}) {
 const tone = mode === 'error' ? 'error' : mode === 'ok' ? 'ok' : 'info';
 return `<div class="pron-feedback pron-feedback--${tone}">
  <span class="pron-feedback-icon">${icon(tone === 'ok' ? 'check' : tone === 'error' ? 'close' : 'spark')}</span>
  <p>${esc(text)}</p>
 </div>`;
}
