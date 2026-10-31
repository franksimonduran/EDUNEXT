import { bootLearningPage } from './learning-page.js';
import { listAchievements } from '../data/achievements-demo.data.js';
import { renderAchievementCard } from '../components/achievement-card.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Mis logros | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const items = listAchievements();
 const got = items.filter(a=>a.status==='obtenida').length;

 root.innerHTML = `<header class="prog-header">
  <div class="prog-title-row"><span class="prog-avatar" aria-hidden="true">${icon('award')}</span><div class="prog-heading"><span class="kicker">EDUNEXT LOGROS</span><h1>Mis logros</h1><p>Descubre todo lo que has conseguido aprendiendo</p></div></div>
 </header>
 <section class="prog-summary">
  <article class="prog-sum-card"><div><strong>${got}</strong><div>Insignias obtenidas</div></div></article>
  <article class="prog-sum-card"><div><strong>${items.length-got}</strong><div>Insignias disponibles</div></div></article>
  <article class="prog-sum-card"><div><strong>70</strong><div>Puntos de demostración</div></div></article>
 </section>
 <section>
  <h2>Galería de insignias</h2>
  <div class="ach-grid">${items.map(renderAchievementCard).join('')}</div>
 </section>`;
 return ()=>{};
},{active:'achievements',demoMessage:()=> 'Datos de demostración'});
