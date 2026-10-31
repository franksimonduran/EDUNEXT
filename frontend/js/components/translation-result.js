import { icon } from './icons.js';
import { categoryLabel } from '../utils/language-format.js';
import { dirAttributes } from '../utils/text-direction.js';
import { renderAudioControls } from './audio-controls.js';
import { ts } from '../student/translator-i18n.js';
import { escapeHTML as esc } from './student-ui.js';

// Tarjeta educativa del resultado. Todos los datos provienen del diccionario local;
// nada se inventa en tiempo de ejecución.
export function renderTranslationResult({ entry, from, to, saved = false }) {
 const topic = entry.topic ? `<li><span class="meta-label">${ts('topic')}</span><span class="meta-value">${esc(entry.topic)}</span></li>` : '';
 return `<article class="result-word-card" data-word-id="${esc(entry.id)}">
  <header class="result-head">
   <div>
    <p class="result-translation" ${dirAttributes(to)}>${esc(entry.translation)}</p>
    <p class="result-source" ${dirAttributes(from)}>${esc(entry.word)}</p>
   </div>
   <span class="category-pill">${esc(categoryLabel(entry.category))}</span>
  </header>
  <ul class="result-meta"><li><span class="meta-label">${ts('category')}</span><span class="meta-value">${esc(categoryLabel(entry.category))}</span></li>${topic}</ul>
  <div class="result-example">
   <h3>${ts('example')}</h3>
   <p class="example-original" ${dirAttributes(from)}>${esc(entry.example)}</p>
   <p class="example-translation" ${dirAttributes(to)}>${esc(entry.exampleTranslation)}</p>
   <p class="meta-label">${ts('exampleTranslation')}</p>
  </div>
  ${renderAudioControls({ target: 'result', lang: entry.to, label: ts('listen'), variant: 'row' })}
  <div class="result-actions">
   <button type="button" class="button-primary" data-save-word="${esc(entry.id)}" aria-pressed="${saved}">${icon('star')}<span data-save-label>${saved ? ts('remove') : ts('save')}</span></button>
   <a class="button-secondary" href="#" data-detail-word="${esc(entry.id)}">${ts('seeDetail')}</a>
   <button type="button" class="button-monitor" data-pronounce>${esc(ts('tryPronounce'))}</button>
  </div>
  <p class="speech-note">${ts('speechNote')}</p>
 </article>`;
}

// Bloque de resultado alternativo (sin entrada local).
export function renderResultNotice(kind, values = {}) {
 const messages = { pairUnavailable: ts('pairUnavailable'), notFound: ts('notFound', values), error: ts('error'), invalid: ts('invalid'), empty: ts('empty'), tooLong: ts('tooLong', values), sameLanguage: ts('sameLanguage') };
 const notes = { pairUnavailable: ts('pairUnavailableNote'), notFound: ts('notFoundNote') };
 const message = messages[kind] ?? ts('error');
 const note = notes[kind] ? `<p class="notice-note">${notes[kind]}</p>` : '';
 const tone = kind === 'notFound' || kind === 'pairUnavailable' ? 'info' : 'error';
 return `<div class="result-notice result-notice--${tone}" role="status"><span class="notice-icon" aria-hidden="true">${icon(tone === 'info' ? 'spark' : 'close')}</span><div><p>${message}</p>${note}</div></div>`;
}
