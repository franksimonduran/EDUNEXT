import { bootLearningPage } from './learning-page.js';
import { getEvaluation } from '../data/evaluations-demo.data.js';
import { getEvaluationQuestions } from '../data/evaluation-questions-demo.data.js';
import { renderQuestion } from '../components/question-renderer.js';
import { renderQuestionNavigator } from '../components/question-navigator.js';
import { renderEvaluationTimer } from '../components/evaluation-timer.js';
import { remainingTime, formatTime } from '../utils/evaluation-time.js';
import { createAttempt, saveAttempt, finalizeAttempt } from '../services/evaluation-attempt.service.js';
import { saveDraft, loadDraft } from '../offline/evaluation-draft-store.js';
import { countAnswered } from '../utils/evaluation-validation.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Resolver evaluación | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const item = getEvaluation(id);
 const questions = getEvaluationQuestions(id);

 if(!item){
  root.innerHTML = '<section class="eval-panel"><h1>Evaluación no encontrada</h1></section>';
  return ()=>{};
 }

 let attempt = createAttempt(id);
 let current = 0;
 let answers = {};
 let review = [];
 let timerSec = remainingTime(attempt.startedAt, item.durationMinutes);
 let timerId = null;

 async function init(){
  try {
   const d = await loadDraft(attempt.id);
   if(d){ attempt=d; answers=d.answers||{}; review=d.review||[]; current=d.current||0; timerSec = remainingTime(attempt.startedAt, item.durationMinutes); }
  } catch{}
  render();
  startTimer();
 }

 function startTimer(){
  if(timerId) clearInterval(timerId);
  timerId = setInterval(()=>{
   timerSec = remainingTime(attempt.startedAt, item.durationMinutes);
   const t = document.querySelector('#eval-timer-slot');
   if(t) t.innerHTML = renderEvaluationTimer(timerSec, timerSec<=300 && timerSec>60, timerSec<=60);
   if(timerSec<=0){
    clearInterval(timerId);
    attempt = finalizeAttempt(attempt);
    location.assign(`revisar-evaluacion.html?id=${id}`);
   }
  }, 1000);
 }

 async function persist(){
  attempt = saveAttempt(attempt, { answers, review, current });
  try { await saveDraft(attempt); } catch{}
  const s = document.querySelector('#save-state');
  if(s) s.textContent = 'Guardado en este dispositivo';
 }

 function render(){
  const q = questions[current];
  root.innerHTML = `<header class="eval-player-header">
   <div class="eval-title-row">
    <span class="eval-avatar" aria-hidden="true">${icon('clipboard')}</span>
    <div class="eval-heading">
     <span class="kicker">EDUNEXT EVALUACIÓN</span>
     <h1>${item.title}</h1>
     <p>${item.course} · Pregunta ${current+1}/${questions.length} · Respondidas: ${countAnswered(questions,answers)}</p>
    </div>
   </div>
   <div class="eval-player-actions">
    <span id="eval-timer-slot">${renderEvaluationTimer(timerSec, timerSec<=300 && timerSec>60, timerSec<=60)}</span>
    <span id="save-state">Sin guardar cambios</span>
    <button class="button-secondary" id="btn-mark">${review.includes(q.id)?'Desmarcar revisar':'Marcar para revisar'}</button>
    <button class="button-primary" id="btn-review">Revisar evaluación</button>
   </div>
  </header>
  <div class="eval-player-main">
   <section class="eval-question">
    <div id="q-root"></div>
    <div class="eval-player-nav">
     <button class="button-secondary" id="prev" ${current===0?'disabled':''}>Anterior</button>
     <button class="button-primary" id="next">${current===questions.length-1?'Ir a revisión':'Siguiente'}</button>
    </div>
   </section>
   <div id="nav-slot"></div>
  </div>`;

  const qroot = root.querySelector('#q-root');
  qroot.innerHTML = renderQuestion(q, answers[q.id], false);
  import('../components/question-renderer.js').then(m=>{ m.mountQuestion(qroot, q, answers[q.id], (v)=>{ answers[q.id]=v; persist(); }); });

  document.querySelector('#nav-slot').innerHTML = renderQuestionNavigator(questions, answers, review, current);
  root.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{ current=Number(btn.dataset.nav); persist(); render(); }));

  root.querySelector('#prev').addEventListener('click',()=>{ if(current>0){ current--; persist(); render(); }});
  root.querySelector('#next').addEventListener('click',()=>{
   if(current===questions.length-1){ location.assign(`revisar-evaluacion.html?id=${id}`); return; }
   current++; persist(); render();
  });
  root.querySelector('#btn-mark').addEventListener('click',()=>{
   if(review.includes(q.id)) review = review.filter(x=>x!==q.id); else review.push(q.id);
   persist(); render();
  });
  root.querySelector('#btn-review').addEventListener('click',()=>{ location.assign(`revisar-evaluacion.html?id=${id}`); });
 }

 init();
 return ()=>{ if(timerId) clearInterval(timerId); };
},{active:'evaluations'});
