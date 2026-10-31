import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderMissionCard(m){
 const link = m.link || '#';
 return `<article class="mission-card">
  <header class="mission-head"><h3>${esc(m.title)}</h3><span class="mission-reward">+${m.reward} pts</span></header>
  <p>${esc(m.desc)}</p>
  <div class="mission-meta"><span>Progreso: ${m.progress}/${m.goal}</span><span>${m.status}</span></div>
  <a class="button-primary" href="${link}">Ir a la actividad</a>
 </article>`;
}
