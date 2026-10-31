import { icon } from './icons.js';
import { categoryLabel } from '../utils/language-format.js';
import { dirAttributes } from '../utils/text-direction.js';
import { renderAudioControls } from './audio-controls.js';
import { ts } from '../student/translator-i18n.js';
import { escapeHTML as esc } from './student-ui.js';

// Tarjeta de repaso (flashcard) con dos caras. La cara trasera se revela al pulsar.
export function renderFlashcard(entry, { index, total, revealed = false }) {
 return `<article class="flashcard ${revealed ? 'is-revealed' : ''}" data-flashcard="${esc(entry.id)}">
  <p class="flashcard-counter">${ts('cardOf', { current: index + 1, total })}</p>
  <div class="flashcard-front">
   <p class="flashcard-prompt">${ts('flashcardPrompt')}</p>
   <p class="flashcard-word" ${dirAttributes(entry.from)}>${esc(entry.word)}</p>
   <span class="category-pill">${esc(categoryLabel(entry.category))}</span>
  </div>
  <div class="flashcard-back" ${revealed ? '' : 'hidden'}>
   <p class="flashcard-translation" ${dirAttributes(entry.to)}>${esc(entry.translation)}</p>
   ${renderAudioControls({ target: `flash-${entry.id}`, lang: entry.to, label: ts('listen') })}
  </div>
  <div class="flashcard-actions">
   <button type="button" class="button-secondary" data-flash-prev>${icon('chevron')}<span>${ts('previous')}</span></button>
   <button type="button" class="button-primary" data-flash-toggle aria-pressed="${revealed}">${icon('flip')}<span>${revealed ? ts('hideTranslation') : ts('showTranslation')}</span></button>
   <button type="button" class="button-secondary" data-flash-next>${ts('next')}${icon('arrow')}</button>
  </div>
 </article>`;
}
