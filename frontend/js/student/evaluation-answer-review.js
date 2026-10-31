import { bootLearningPage } from './learning-page.js';
import { getEvaluation } from '../data/evaluations-demo.data.js';
import { getEvaluationQuestions } from '../data/evaluation-questions-demo.data.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Revisión de evaluación | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const item = getEvaluation(id);
 const questions = getEvaluationQuestions(id);

 if(!item){
  root.innerHTML = '<section class="eval-panel"><h1>Evaluación no encontrada</h1></section>';
  return ()=>{};
 }

 root.innerHTML = `<header class="eval-header"><div class="eval-title-row"><span class="eval-avatar" aria-hidden="true">${icon('clipboard')}</span><div class="eval-heading"><h1>Revisión de evaluación</h1><p>${item.title}</p></div></div><div class="eval-header-actions"><a class="button-secondary" href="resultado-evaluacion.html?id=${id}">Volver a resultado</a></div></header>
 <section class="eval-panel">
  <p class="modal-warn">Tu evaluación está pendiente de revisión. Las respuestas correctas y comentarios del docente se mostrarán cuando estén publicados.</p>
  <div class="eval-list">
   ${questions.map((q,i)=>`<article class="eval-card"><header class="eval-card-head"><div><h4>Pregunta ${i+1}</h4><p>${q.title}</p></div></article><p><strong>Respuesta del estudiante:</strong> (demostrativo)</p><p><strong>Estado:</strong> Pendiente de revisión</p></article>`).join('')}
  </div>
 </section>`;
 return ()=>{};
},{active:'evaluations'});
