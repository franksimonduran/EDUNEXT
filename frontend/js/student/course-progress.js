import { bootLearningPage } from './learning-page.js';
import { getProgress } from '../data/progress-demo.data.js';
import { renderProgressBar } from '../components/progress-summary.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Progreso por curso | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const course = params.get('course') || 'Matemática';
 const grade = route.grade ? Number(route.grade) : 4;
 const p = getProgress({grade});
 const c = p.courses.find(x=>x.course===course) || p.courses[0];

 root.innerHTML = `<header class="prog-header"><div class="prog-title-row"><span class="prog-avatar" aria-hidden="true">${icon('book')}</span><div class="prog-heading"><span class="kicker">${course}</span><h1>Progreso por curso</h1><p>Grado ${grade}</p></div></div><div class="prog-header-actions"><a class="button-secondary" href="progreso.html?grade=${grade}">Volver a Progreso</a></div></header>
 <section class="prog-general">
  <h2>Avance general</h2>
  ${renderProgressBar(c.percent)}
  <p>${c.completed}/${c.total} lecciones</p>
 </section>
 <section class="prog-panel">
  <h2>Unidades</h2>
  <div class="courses-grid">
   <article class="course-prog-card"><h3>Unidad 1</h3><p>Lecciones: 4 · Completadas: 1</p><span>En progreso</span><a class="button-secondary" href="aprende.html?grade=${grade}">Ver unidad</a></article>
   <article class="course-prog-card"><h3>Unidad 2</h3><p>Lecciones: 4 · Completadas: 1</p><span>En progreso</span><a class="button-secondary" href="aprende.html?grade=${grade}">Ver unidad</a></article>
  </div>
 </section>`;
 return ()=>{};
},{active:'progress'});
