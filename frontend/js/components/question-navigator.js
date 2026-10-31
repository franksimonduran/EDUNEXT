import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderQuestionNavigator(questions, answers, review, current){
 return `<aside class="question-nav">
  <h3>Navegador de preguntas</h3>
  <div class="nav-grid">
   ${questions.map((q,i)=>{
    const idx = i;
    const ans = answers[q.id];
    let state='sin-responder';
    if(review && review.includes(q.id)) state='marcada';
    if(q.type==='matching'){ if(ans && Object.keys(ans).length) state='respondida'; }
    else if(q.type==='ordering'){ if(Array.isArray(ans)&&ans.length) state='respondida'; }
    else if(String(ans??'').trim()) state = review && review.includes(q.id)?'marcada':'respondida';
    if(current===idx) state='actual';
    return `<button type="button" class="nav-btn nav-btn--${state}" data-nav="${idx}">${idx+1}</button>`;
   }).join('')}
  </div>
  <ul class="nav-legend">
   <li><span class="dot dot--sin"></span> Sin responder</li>
   <li><span class="dot dot--ok"></span> Respondida</li>
   <li><span class="dot dot--rev"></span> Marcada para revisar</li>
   <li><span class="dot dot--cur"></span> Actual</li>
  </ul>
 </aside>`;
}
