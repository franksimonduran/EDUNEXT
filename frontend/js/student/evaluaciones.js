import { bootLearningPage } from './learning-page.js';
import { listEvaluations } from '../data/evaluations-demo.data.js';
import { renderEvaluationCard } from '../components/evaluation-card.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Mis evaluaciones | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const grade = route.grade ? Number(route.grade) : 4;
 let state = { status: 'all', course: 'all' };
 const all = listEvaluations({ grade });

 function counts(items){
  const disponibles = items.filter(i=>i.status==='disponible').length;
  const proximas = items.filter(i=>i.status==='programada').length;
  const finalizadas = items.filter(i=>i.status==='finalizada').length;
  return { disponibles, proximas, finalizadas };
 }

 function render(){
  const items = all.filter(i=>{
   if(state.status!=='all'){
    if(state.status==='en-progreso') return i.status==='en-progreso';
    if(state.status==='disponibles') return i.status==='disponible';
    if(state.status==='proximas') return i.status==='programada';
    if(state.status==='finalizadas') return i.status==='finalizada';
   }
   if(state.course!=='all' && i.course!==state.course) return false;
   return true;
  });
  const c = counts(all);
  root.innerHTML = `<header class="eval-header">
   <div class="eval-title-row">
    <span class="eval-avatar" aria-hidden="true">${icon('clipboard')}</span>
    <div class="eval-heading">
     <span class="kicker">EDUNEXT EVALUACIONES</span>
     <h1>Mis evaluaciones</h1>
     <p>Organiza tus evaluaciones y demuestra lo que has aprendido</p>
    </div>
   </div>
   <div class="eval-header-actions"><span>Grado: ${grade}</span></div>
  </header>
  <section class="eval-summary">
   <article class="eval-summary-card"><div><strong>${c.disponibles}</strong><div>Disponibles</div></div></article>
   <article class="eval-summary-card"><div><strong>${c.proximas}</strong><div>Próximas</div></div></article>
   <article class="eval-summary-card"><div><strong>${c.finalizadas}</strong><div>Finalizadas</div></div></article>
  </section>
  <section class="eval-filters">
   <select id="f-status" aria-label="Estado de evaluación">
    <option value="all">Todas</option>
    <option value="disponibles">Disponibles</option>
    <option value="proximas">Próximas</option>
    <option value="en-progreso">En progreso</option>
    <option value="finalizadas">Finalizadas</option>
   </select>
   <select id="f-course" aria-label="Asignatura">
    <option value="all">Todas las asignaturas</option>
    <option>Matemática</option>
    <option>Comunicación</option>
    <option>Ciencia y Tecnología</option>
    <option>Personal Social</option>
    <option>Inglés</option>
   </select>
  </section>
  <section class="eval-list">${items.length? items.map(renderEvaluationCard).join(''): '<p>No hay evaluaciones para este filtro.</p>'}</section>`;

  root.querySelector('#f-status').addEventListener('change', e=>{ state.status=e.target.value; render(); });
  root.querySelector('#f-course').addEventListener('change', e=>{ state.course=e.target.value; render(); });
 }
 render();
 return ()=>{};
},{active:'evaluations',demoMessage:()=> 'Datos de demostración'});
