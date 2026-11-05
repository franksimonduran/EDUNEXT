import {DEMO_READING,DEMO_QUESTIONS,DEMO_STUDENT,readDemoResult,saveDemoResult} from './scenario.js';

const root=document.querySelector('#demo-activity');
const answers=Array(DEMO_QUESTIONS.length).fill(null);
let step=0;
let finished=false;
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderStep(){
  const question=DEMO_QUESTIONS[step],progress=Math.round((step+1)*100/DEMO_QUESTIONS.length);
  root.innerHTML=`<section class="quiz-card" aria-labelledby="quiz-title">
    <div class="quiz-meta"><span class="label-chip">Comunicación · ${DEMO_STUDENT.group}</span><span>Pregunta ${step+1} de ${DEMO_QUESTIONS.length}</span></div>
    <div class="quiz-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-label="Avance de preguntas"><span style="width:${progress}%"></span></div>
    <h2 id="quiz-title">${escapeHTML(question.prompt)}</h2>
    <fieldset class="quiz-options"><legend>Selecciona una respuesta</legend>
    ${question.choices.map((choice,index)=>`<label class="quiz-option ${answers[step]===index?'is-selected':''}"><input type="radio" name="answer" value="${index}" ${answers[step]===index?'checked':''}><span class="option-letter">${String.fromCharCode(65+index)}</span><span>${escapeHTML(choice)}</span></label>`).join('')}
    </fieldset>
    <div class="quiz-actions"><button type="button" class="button-outline" data-action="back" ${step===0?'disabled':''}>Anterior</button><button type="button" class="button-primary" data-action="next" ${answers[step]===null?'disabled':''}>${step===DEMO_QUESTIONS.length-1?'Finalizar práctica':'Siguiente pregunta'}</button></div>
    <p class="quiz-help">Respuestas de muestra. El resultado se calcula al finalizar y se muestra en los tres perfiles de este navegador.</p>
  </section>`;
}
function renderResult(){
  finished=true;
  const result=saveDemoResult(answers);
  root.innerHTML=`<section class="quiz-card quiz-result" aria-labelledby="quiz-title">
    <div class="label-chip">Práctica finalizada · Datos ficticios</div>
    <h2 id="quiz-title">¡Práctica completada!</h2>
    <div class="result-score" aria-label="${result.correct} respuestas correctas de ${result.total}"><strong>${result.percent}%</strong><span>${result.correct} de ${result.total} respuestas correctas</span></div>
    <p>${result.correct===result.total?'¡Excelente comprensión del texto!':'Cada respuesta es una oportunidad de aprender. Revisa las explicaciones.'}</p>
    <details class="answer-review"><summary>Revisar respuestas y explicaciones</summary>
    <ol>${DEMO_QUESTIONS.map((question,index)=>`<li><strong>${escapeHTML(question.prompt)}</strong><p class="${answers[index]===question.correct?'answer-right':'answer-wrong'}">${answers[index]===question.correct?'Correcto':'Para mejorar'}: ${escapeHTML(question.choices[question.correct])}</p><p>${escapeHTML(question.explanation)}</p></li>`).join('')}</ol>
    </details>
    <p class="quiz-help">${result.persisted?'Resultado guardado únicamente en este navegador para la demostración.':'El navegador bloqueó el almacenamiento; este resultado solo estará disponible mientras permanezca abierta esta página.'} No es una calificación oficial.</p>
    <div class="result-links"><a class="button-primary" href="../student/index.html?grade=5&modo=demo">Ver mi progreso</a><a class="button-outline" href="../monitor/index.html?modo=demo">Ver como monitor</a><a class="button-outline" href="../admin/index.html?modo=demo">Ver como administrador</a><a class="button-outline" href="../student/tutor-demo.html?modo=demo&topic=reading&prompt=feedback">Recibir explicación guiada</a></div>
    <button type="button" class="text-action" data-action="repeat">Volver a practicar</button>
  </section>`;
}
root?.addEventListener('change',event=>{
  if(finished||event.target.name!=='answer')return;
  const choice=Number(event.target.value);
  if(!Number.isInteger(choice)||choice<0||choice>=DEMO_QUESTIONS[step].choices.length)return;
  answers[step]=choice;
  // Preserve keyboard focus after selecting an option.
  root.querySelectorAll('.quiz-option').forEach((label,index)=>label.classList.toggle('is-selected',index===choice));
  const next=root.querySelector('[data-action="next"]');
  if(next)next.disabled=false;
});
root?.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='repeat'){answers.fill(null);step=0;finished=false;renderStep();return;}
  if(finished)return;
  if(action==='back'&&step>0){step--;renderStep();}
  if(action==='next'&&answers[step]!==null){
    if(step===DEMO_QUESTIONS.length-1)renderResult();
    else{step++;renderStep();}
  }
});
if(root){
  const prior=readDemoResult();
  if(prior){const note=document.querySelector('#previous-result');if(note)note.textContent=`Resultado anterior: ${prior.percent}% · Puedes repetir la práctica.`;}
  document.querySelector('#demo-reading-title').textContent=DEMO_READING.title;
  document.querySelector('#demo-reading-text').textContent=DEMO_READING.passage;
  renderStep();
}
