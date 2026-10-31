import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderPronunciationCard({ item, href }) {
 const difficulty = item.difficulty === 'reference' ? 'Referencia' : item.difficulty === 'advanced' ? 'Avanzado' : item.difficulty === 'intermediate' ? 'Intermedio' : 'Principiante';
 return `<article class="pron-card">
  <header class="pron-card-head">
   <div>
    <h3 class="pron-card-title">${esc(item.word)}</h3>
    <p class="pron-card-sub">${esc(item.translation)} · ${esc(item.lang.toUpperCase())} · ${difficulty}</p>
   </div>
   <span class="pron-card-topic">${esc(item.topic)}</span>
  </header>
  ${item.example ? `<p class="pron-card-example">${esc(item.example)}</p>` : ''}
  <div class="pron-card-actions">
   <a class="button-primary" href="${href}">${icon('mic')}<span>Practicar</span></a>
  </div>
 </article>`;
}
