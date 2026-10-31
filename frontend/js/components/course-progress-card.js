import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';
import { renderProgressBar } from './progress-summary.js';

export function renderCourseProgressCard(c){
 return `<article class="course-prog-card">
  <header class="course-prog-head"><h3>${esc(c.course)}</h3><span>Grado ${c.grade}</span></header>
  ${renderProgressBar(c.percent)}
  <p>${c.completed}/${c.total} lecciones · Última: ${esc(c.last||'-')}</p>
  <a class="button-secondary" href="progreso-curso.html?course=${encodeURIComponent(c.course)}&grade=${c.grade}">Ver progreso</a>
 </article>`;
}
