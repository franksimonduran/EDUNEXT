import {renderQuestion,mountQuestion,initialAnswer} from '../components/question-renderer.js';
import {renderAnswerFeedback} from '../components/answer-feedback.js';
import {renderPracticeProgress} from '../components/practice-progress.js';
import {escapeHTML as esc} from '../components/student-ui.js';
import {validateAnswer} from '../utils/answer-validation.js';
import {saveSession,canStoreSession} from '../services/activity-session.service.js';
import {learningURL} from './learning-routes.js';
import {pt} from './practice-i18n.js';
import {text} from './i18n.js';
import {renderActivityResults} from './activity-results-view.js';
import {protectWork} from '../core/work-guard.js';

export function finishActivity(root,activity,session){
 session.status='completed';saveSession(session);
 if(canStoreSession())location.assign(learningURL('results',{grade:activity.grade,activity:activity.id,run:session.id}));
 else renderActivityResults(root,activity,session);
}
export function activityHeading(activity){return `<header class="activity-header"><div><span class="eyebrow-light">${esc(text(activity.courseName))} · ${activity.grade}.º</span><h1 lang="es">${esc(activity.name)}</h1><p lang="es">${esc(activity.topic)}</p></div><a class="button-secondary" href="${learningURL(activity.kind==='game'?'games':'practice',{grade:activity.grade})}">${activity.kind==='game'?pt('games'):pt('back')}</a></header>`;}

export function mountQuestionActivity(root,activity,session){
 if(session.status==='completed'){renderActivityResults(root,activity,session);return ()=>{};}
  let disposed=false;
  let saved = canStoreSession();
  const guard = protectWork({
   hasUnsavedChanges: () => !disposed && (!saved||!canStoreSession()) && (session.status==='completed'||Object.values(session.drafts).some(value=>typeof value==='string'?value.length>0:Array.isArray(value)?value.length>0:Object.keys(value??{}).length>0)),
   message: () => pt('leaveUnsaved'),
  });
  function persist() {
   saved = saveSession(session);
   const status = root.querySelector('#activity-save-status');
   if (status) {
    const message = pt(saved?'savedHere':'unsavedHere');
    if (status.textContent !== message) status.textContent = message;
    status.dataset.saved = String(saved);
   }
  }
 function draw(focus){
  if(disposed)return;
  const question=activity.questions[session.index];
  let record=session.records.find(record=>record.id===question.id);
  if(!record){record={id:question.id,topic:question.topic,explanation:question.explanation,attempts:[],hintsUsed:0};session.records.push(record);}
  if(!(question.id in session.drafts))session.drafts[question.id]=initialAnswer(question);
  let value=session.drafts[question.id];
  if(question.type==='ordering'&&!validateAnswer(question,value).valid)value=session.drafts[question.id]=initialAnswer(question);
  if(question.type==='matching'&&(!value||typeof value!=='object'))value=session.drafts[question.id]={};
  const locked=record.checked===true;
  root.innerHTML=`${activityHeading(activity)}${renderPracticeProgress(session.index,activity.questions.length)}<div class="exercise-layout"><section class="dashboard-card exercise-card"><form id="activity-question" novalidate><div id="question-controls">${renderQuestion(question,value,locked)}</div><p id="answer-message" class="answer-message" role="status" aria-live="polite">${locked?pt('checked'):''}</p><div class="question-actions"><button class="button-primary" type="submit" ${locked?'disabled':''}>${pt('check')}</button><button class="button-secondary" type="button" id="retry-answer" ${locked?'':'hidden'}>${pt('retry')}</button><button class="button-primary" type="button" id="next-question" ${locked?'':'hidden'}>${session.index===activity.questions.length-1?pt('showResults'):pt('next')}</button></div></form><div id="answer-feedback" role="status">${locked?renderAnswerFeedback(record.attempts.at(-1).correct,question.explanation):''}</div>${locked&&question.type==='matching'?`<ul class="pair-feedback">${question.pairs.map(pair=>`<li lang="es">${esc(pair.left)} → ${esc(question.pairs.find(item=>item.id===value[pair.id])?.right??'—')}: ${pt(value[pair.id]===pair.id?'correct':'incorrect')}</li>`).join('')}</ul>`:''}</section><aside class="dashboard-card hint-card"><h2>${pt('hintsUsed')}: ${record.hintsUsed}</h2>${question.hints?.length?`<button class="button-secondary" id="show-hint" type="button" ${record.hintsUsed>=question.hints.length?'disabled':''}>${pt('hint')}</button><div id="hint-content" role="status">${question.hints.slice(0,record.hintsUsed).map((hint,index)=>`<p lang="es"><strong>${pt('hintSeen')} ${index+1}.</strong> ${esc(hint)}</p>`).join('')}</div>`:''}<p class="scoring-note">${pt('first')}</p></aside></div><nav class="activity-exit"><a class="button-secondary" href="${learningURL(activity.kind==='game'?'games':'practice',{grade:activity.grade})}">${pt('exit')}</a><a class="button-secondary" data-reset href="${learningURL(activity.kind==='game'?'game':'exercise',{grade:activity.grade,activity:activity.id,lesson:session.originLesson})}">${pt('restart')}</a></nav><p class="activity-disclaimer">${pt('demo')} ${pt('offline')}${canStoreSession()?'':` ${pt('storage')}`}</p>`;
  const form=root.querySelector('#activity-question');
  const status = document.createElement('p');
  status.id = 'activity-save-status';
  status.className = 'work-status';
  status.setAttribute('role', 'status');
  form.before(status);
  if(locked){
   const selected=root.querySelector('.answer-option:has(input:checked)');
   if(selected){
    const correct=record.attempts.at(-1).correct;
    selected.classList.add(correct?'is-correct':'is-incorrect');
    const status=document.createElement('small');status.className='choice-feedback';status.textContent=`${correct?'✓':'↻'} ${pt(correct?'correct':'incorrect')}`;selected.append(status);
   }
   // Actualizar la región ya montada facilita el anuncio de la explicación.
   const feedback=root.querySelector('#answer-feedback');const content=feedback.innerHTML;feedback.replaceChildren();
   requestAnimationFrame(()=>{if(!disposed&&feedback.isConnected)feedback.innerHTML=content;});
  }
  mountQuestion(root.querySelector('#question-controls'),question,value,(next,meta)=>{
    session.drafts[question.id]=next;persist();
   root.querySelector('#answer-message').textContent='';
   if(meta?.repaint){draw();const buttons=[...root.querySelectorAll('[data-move]')].filter(button=>button.dataset.move===meta.focusId);(buttons.find(button=>button.dataset.direction===meta.direction&&!button.disabled)??buttons.find(button=>!button.disabled))?.focus();root.querySelector('#answer-message').textContent=`${pt('position')} ${next.indexOf(meta.focusId)+1}`;}
  });
  form.addEventListener('submit',event=>{
   event.preventDefault();if(record.checked)return;
   const answer=session.drafts[question.id],validation=validateAnswer(question,answer);
   if(!validation.valid){root.querySelector('#answer-message').textContent=pt('select');root.querySelector('input:not(:disabled),select:not(:disabled)')?.focus();return;}
    record.attempts.push({answer:structuredClone(answer),correct:validation.correct});record.checked=true;persist();draw('next-question');
  });
   root.querySelector('#retry-answer').addEventListener('click',()=>{record.checked=false;persist();draw();root.querySelector('input:not(:disabled),select:not(:disabled),[data-move]:not(:disabled)')?.focus();});
  root.querySelector('#next-question').addEventListener('click',()=>{
   if(!record.checked)return;
   if(session.index===activity.questions.length-1){finishActivity(root,activity,session);return;}
    session.index++;persist();draw();root.querySelector('.question-fieldset legend').setAttribute('tabindex','-1');root.querySelector('.question-fieldset legend').focus();
  });
  root.querySelector('#show-hint')?.addEventListener('click',()=>{
   if(record.hintsUsed>=question.hints.length)return;
    record.hintsUsed++;persist();
   const content=root.querySelector('#hint-content');const paragraph=document.createElement('p');paragraph.lang='es';paragraph.textContent=`${pt('hintSeen')} ${record.hintsUsed}. ${question.hints[record.hintsUsed-1]}`;content.append(paragraph);
   root.querySelector('.hint-card h2').textContent=`${pt('hintsUsed')}: ${record.hintsUsed}`;
   if(record.hintsUsed===question.hints.length){root.querySelector('#show-hint').disabled=true;root.querySelector('#show-hint').textContent=pt('hintEnd');}
  });
   persist();
   if(focus)root.querySelector('#'+focus)?.focus();
 }
  draw();return ()=>{disposed=true;guard.dispose();};
}
