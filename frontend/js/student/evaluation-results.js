import { bootLearningPage } from './learning-page.js';
import { getEvaluation } from '../data/evaluations-demo.data.js';
import { getEvaluationQuestions } from '../data/evaluation-questions-demo.data.js';
import { computeDemoScore } from '../utils/evaluation-results.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Resultado evaluación | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const item = getEvaluation(id);
 const questions = getEvaluationQuestions(id);

 if(!item){
  root.innerHTML = '<section class="eval-panel"><h1>Evaluación no encontrada</h1></section>';
  return ()=>{};
 }

 const score = computeDemoScore(questions, {});
 root.innerHTML = `<header class="eval-header"><div class="eval-title-row"><span class="eval-avatar" aria-hidden="true">${icon('clipboard')}</span><div class="eval-heading"><h1>Has finalizado tu intento de demostración</h1><p>${item.title} · ${item.course}</p></div></div></header>
 <section class="eval-panel">
  <h3>Estado del intento</h3>
  <ul>
   <li>Evaluación: ${item.title}</li>
   <li>Fecha local: ${new Date().toLocaleString()}</li>
   <li>Preguntas: ${questions.length}</li>
   <li>Estado: Finalizada localmente</li>
   <li>Estado de sincronización: Local (no enviado al servidor)</li>
  </ul>
  <p class="modal-warn">El intento está guardado en este dispositivo. Todavía no ha sido enviado a un servidor.</p>
  <h3>Resultado demostrativo (solo objetivo)</h3>
  <ul>
   <li>Aciertos demostrativos: ${score.correct}/${score.objective}</li>
   <li>Preguntas abiertas: ${score.open}</li>
   <li>Porcentaje demostrativo: ${score.pct}%</li>
  </ul>
  <p class="modal-warn">Nota: cálculo demostrativo. No es una calificación oficial.</p>
  <div class="eval-player-nav">
   <a class="button-secondary" href="evaluaciones.html?grade=${item.grade}">Volver a Mis evaluaciones</a>
   <a class="button-primary" href="revision-evaluacion.html?id=${id}">Revisar evaluación (demo)</a>
  </div>
 </section>`;
 return ()=>{};
},{active:'evaluations'});
