import { icon } from './icons.js';
import { categoryLabel, languageName } from '../utils/language-format.js';
import { dirAttributes } from '../utils/text-direction.js';
import { ts } from '../student/translator-i18n.js';
import { escapeHTML as esc } from './student-ui.js';

// Tarjeta de palabra guardada. Se usa en Mi vocabulario y en el detalle.
export function renderVocabularyCard(entry) {
 return `<article class="vocabulary-card" data-word-id="${esc(entry.id)}">
  <div class="vocab-head">
   <div class="vocab-words">
    <p class="vocab-translation" ${dirAttributes(entry.to)}>${esc(entry.translation)}</p>
    <p class="vocab-word" ${dirAttributes(entry.from)}>${esc(entry.word)}</p>
   </div>
   <button type="button" class="icon-button vocab-star is-saved" data-remove-word="${esc(entry.id)}" aria-label="${esc(ts('remove'))}" aria-pressed="true">${icon('star')}</button>
  </div>
  <ul class="vocab-meta">
   <li>${esc(languageName(entry.from))} → ${esc(languageName(entry.to))}</li>
   <li><span class="category-pill">${esc(categoryLabel(entry.category))}</span></li>
  </ul>
  <div class="vocab-actions">
   <button class="vocab-action" data-detail-word="${esc(entry.id)}">${icon('spark')}<span>${ts('seeDetail')}</span></button>
   <button class="vocab-action" data-pronounce-word data-word="${esc(entry.word)}" data-lang="${esc(entry.to || entry.from || 'en')}">${icon('mic')}<span>Pronunciar</span></button>
   <button class="vocab-action" data-remove-word-card="${esc(entry.id)}">${icon('trash')}<span>${ts('remove')}</span></button>
   <button type="button" class="icon-button" data-speak="${esc(entry.id)}" data-speak-lang="${esc(entry.to)}" data-speak-rate="normal" aria-label="${esc(ts('listen'))}">${icon('speaker')}</button>
   <a class="text-button" href="#" data-detail-word="${esc(entry.id)}">${ts('openDetail')}</a>
  </div>
 </article>`;
}
