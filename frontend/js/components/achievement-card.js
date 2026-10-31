import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderAchievementCard(a){
 const cls = a.status==='obtenida'?'ach-card ach-card--got':'ach-card ach-card--pend';
 return `<article class="${cls}">
  <div class="ach-icon">${icon(a.icon||'spark')}</div>
  <h3>${esc(a.name)}</h3>
  <p>${esc(a.desc)}</p>
  ${a.status==='obtenida'?`<span class="ach-date">Obtenida</span>`:`<span class="ach-prog">${a.progress}/${a.goal}</span>`}
  <a class="button-secondary" href="detalle-logro.html?id=${a.id}">Ver detalles</a>
 </article>`;
}
