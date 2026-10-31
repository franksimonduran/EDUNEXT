import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderLearningRecommendation(r){
 return `<article class="rec-card">
  <div class="rec-head"><span>${icon('spark')}</span><h3>${esc(r.text)}</h3></div>
  <div class="rec-actions">
   ${r.link?`<a class="button-primary" href="${r.link}">Repasar</a>`:`<span></span>`}
  </div>
 </article>`;
}
