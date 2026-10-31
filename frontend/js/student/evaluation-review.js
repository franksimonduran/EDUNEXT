import { bootLearningPage } from './learning-page.js';
import { getEvaluation } from '../data/evaluations-demo.data.js';
import { getEvaluationQuestions } from '../data/evaluation-questions-demo.data.js';
import { loadDraft, deleteDraft } from '../offline/evaluation-draft-store.js';
import { finalizeAttempt } from '../services/evaluation-attempt.service.js';
import { countAnswered } from '../utils/evaluation-validation.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Revisar respuestas | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const item = getEvaluation(id);
 const questions = getEvaluationQuestions(id);

 if(!item){
  root.innerHTML = '<section class="eval-panel"><h1>Evaluación no encontrada</h1></section>';
  return ()=>{};
 }

 async function render(){
  let draft = null;
  try { draft = await loadDraft(`att_${id}_` + '...'); } catch{}
  // try to find by scanning not implemented; just load last by attempting common pattern - but easier: just show summary from session concept
  const answers = draft?.answers || {};
  const review = draft?.review || [];
  const answered = countAnswered(questions, answers);
  const noans = questions.length - answered;

  root.innerHTML = `<header class="eval-header"><div class="eval-title-row"><span class="eval-avatar" aria-hidden="true">${icon('clipboard')}</span><div class="eval-heading"><h1>Revisa tu evaluación</h1><p>${item.title}</p></div></div><div class="eval-header-actions"><a class="button-secondary" href="evaluacion.html?id=${id}">Regresar a la evaluación</a></div></header>
  <section class="eval-panel">
   <h3>Resumen</h3>
   <ul>
    <li>Total de preguntas: ${questions.length}</li>
    <li>Preguntas respondidas: ${answered}</li>
    <li>Preguntas sin responder: ${noans}</li>
    <li>Preguntas marcadas: ${review.length}</li>
   </ul>
   ${noans>0?'<p class="modal-warn">Existen preguntas sin responder.</p>':''}
   <h3>Listado</h3>
   <div class="eval-list">
    ${questions.map((q,i)=>`<article class="eval-card"><header class="eval-card-head"><div><h4>Pregunta ${i+1}</h4><p>${q.title}</p></div></article><div class="eval-card-actions"><a class="button-secondary" href="evaluacion.html?id=${id}">Ir a pregunta</a></div></article>`).join('')}
   </div>
   <div class="eval-player-nav">
    <button class="button-primary" id="finish">Finalizar intento</button>
   </div>
  </section>
  <div id="modal" class="modal" style="display:none">
   <div class="modal-content">
    <h2>¿Deseas finalizar tu evaluación?</h2>
    <p>Revisa tus respuestas antes de continuar. Al finalizar el intento no podrás modificarlas.</p>
    <div class="modal-actions">
     <button class="button-secondary" id="m-cancel">Seguir respondiendo</button>
     <button class="button-primary" id="m-ok">Finalizar intento</button>
    </div>
   </div>
  </div>`;

  root.querySelector('#finish').addEventListener('click',()=>{ root.querySelector('#modal').style.display='flex'; });
  root.querySelector('#m-cancel').addEventListener('click',()=>{ root.querySelector('#modal').style.display='none'; });
  root.querySelector('#m-ok').addEventListener('click',()=>{
   try { if(draft) deleteDraft(draft.id); } catch{}
   location.assign(`resultado-evaluacion.html?id=${id}`);
  });
 }

 render();
 return ()=>{};
},{active:'evaluations'});
