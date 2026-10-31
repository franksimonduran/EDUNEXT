import { bootLearningPage } from './learning-page.js';
import { readLearningRoute } from './learning-routes.js';
import { getEvaluation } from '../data/evaluations-demo.data.js';
import { renderEvaluationInstructions } from '../components/evaluation-instructions.js';
import { renderConfirmModal } from '../components/evaluation-confirmation.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Detalle evaluación | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const item = getEvaluation(id);

 if(!item){
  root.innerHTML = '<section class="eval-panel"><h1>Evaluación no encontrada</h1><p>El elemento de demostración no existe.</p></section>';
  return ()=>{};
 }

 function render(){
  root.innerHTML = `<header class="eval-header"><div class="eval-title-row"><span class="eval-avatar" aria-hidden="true">${icon('clipboard')}</span><div class="eval-heading"><h1>${item.title}</h1><p>${item.course} · Grado ${item.grade}</p></div></div></header>
  <div class="eval-detail">
   <div class="eval-detail-main"><section class="eval-panel"><h3>Información</h3><ul><li>Duración: ${item.durationMinutes} minutos</li><li>Preguntas: ${item.questionCount}</li><li>Fecha de inicio: ${new Date(item.startDate).toLocaleString()}</li><li>Fecha límite: ${new Date(item.endDate).toLocaleString()}</li><li>Intentos permitidos: ${item.attemptsAllowed}</li><li>Intentos utilizados: ${item.attemptsUsed}</li><li>Disponible offline: ${item.offline?'Sí':'No'}</li></ul></section>${renderEvaluationInstructions(item)}</div>
   <div class="eval-detail-side"><section class="eval-panel"><h3>Acciones</h3><button class="button-primary" id="btn-start">Comenzar evaluación</button><a class="button-secondary" href="evaluaciones.html?grade=${item.grade}">Volver</a></section></div>
  </div>
  ${renderConfirmModal({title:item.title,duration:item.durationMinutes,count:item.questionCount,attempts:item.attemptsAllowed - item.attemptsUsed})}`;
  document.getElementById('btn-start').addEventListener('click', ()=>{ document.getElementById('eval-confirm').style.display='flex'; });
  document.getElementById('confirm-cancel').addEventListener('click', ()=>{ document.getElementById('eval-confirm').style.display='none'; });
  document.getElementById('confirm-start').addEventListener('click', ()=>{ location.assign(`evaluacion.html?id=${item.id}`); });
 }
 render();
 return ()=>{};
},{active:'evaluations'});
