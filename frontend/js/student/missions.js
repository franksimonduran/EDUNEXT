import { bootLearningPage } from './learning-page.js';
import { listMissions } from '../data/missions-demo.data.js';
import { renderMissionCard } from '../components/mission-card.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Mis misiones | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const grade = route.grade ? Number(route.grade) : 4;
 let filter='all';

 function render(){
  const items = listMissions(filter);
  root.innerHTML = `<header class="prog-header">
   <div class="prog-title-row"><span class="prog-avatar" aria-hidden="true">${icon('target')}</span><div class="prog-heading"><span class="kicker">EDUNEXT MISIONES</span><h1>Mis misiones</h1><p>Aprende a tu ritmo y completa nuevos desafíos</p></div></div>
  </header>
  <div class="mission-tabs">
   <button class="button-secondary" data-f="all">Todas</button>
   <button class="button-secondary" data-f="daily">Diarias</button>
   <button class="button-secondary" data-f="weekly">Semanales</button>
   <button class="button-secondary" data-f="completed">Completadas</button>
  </div>
  <div class="mission-list">${items.length? items.map(renderMissionCard).join(''): '<p>No hay misiones</p>'}</div>`;
  root.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{ filter=b.dataset.f; render(); }));
 }
 render();
 return ()=>{};
},{active:'missions',demoMessage:()=> 'Datos de demostración'});
