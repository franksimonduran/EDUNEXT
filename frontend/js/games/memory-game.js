import {escapeHTML as esc,progressBar} from '../components/student-ui.js';
import {activityHeading,finishActivity} from '../student/activity-runner.js';
import {renderActivityResults} from '../student/activity-results-view.js';
import {saveSession,canStoreSession} from '../services/activity-session.service.js';
import {pt} from '../student/practice-i18n.js';
import {learningURL} from '../student/learning-routes.js';
import {activityIllustration} from '../components/activity-illustration.js';

export function mountMemoryGame(root,activity,session){
 if(session.status==='completed'){renderActivityResults(root,activity,session);return ()=>{};}
 const cards=[...activity.pairs.map(pair=>({id:pair.id+'-left',pair:pair.id,text:pair.left})),...[...activity.pairs].reverse().map(pair=>({id:pair.id+'-right',pair:pair.id,text:pair.right,image:pair.image}))];
 if(!Array.isArray(session.game.matched)||!session.game.matched.every(id=>activity.pairs.some(pair=>pair.id===id)))session.game.matched=[];
 session.game.matched=[...new Set(session.game.matched)];
 if(!Array.isArray(session.game.open)||!session.game.open.every(id=>cards.some(card=>card.id===id)))session.game.open=[];
 if(session.game.open.length>2||new Set(session.game.open).size!==session.game.open.length)session.game.open=[];
 if(!['matched','notMatched',''].includes(session.game.message))session.game.message='';
 let timer,disposed=false;
 // Una pausa pendiente puede sobrevivir a una recarga; nunca bloquea la partida.
 if(session.game.open.length===2)session.game.open=[];
 function hide(){clearTimeout(timer);session.game.open=[];saveSession(session);draw();root.querySelector('[data-memory]:not(:disabled)')?.focus();}
 function draw(){
  if(disposed)return;
  root.innerHTML=`${activityHeading(activity)}<section class="dashboard-card memory-player"><p>${pt('memoryRules')}</p><div class="memory-stats"><strong>${pt('moves')}: ${session.records.length}</strong><strong>${pt('pairs')}: ${session.game.matched.length} / ${activity.pairs.length}</strong></div>${progressBar(session.game.matched.length/activity.pairs.length*100,pt('pairs'))}<div class="memory-board">${cards.map((card,index)=>{const matched=session.game.matched.includes(card.pair),visible=matched||session.game.open.includes(card.id);return `<button type="button" data-memory="${card.id}" class="memory-card ${visible?'is-open':''} ${matched?'is-matched':''}" aria-label="${visible?esc(card.text):`${pt('card')} ${index+1}, ${pt('hidden')}`}" ${matched?'disabled':''}><span ${visible?'lang="es"':''}>${visible?esc(card.text):'?'}</span>${matched?'<small>✓</small>':''}</button>`;}).join('')}</div><p class="memory-message" id="memory-message" role="status">${session.game.message?pt(session.game.message):''}</p><button class="button-secondary" id="hide-memory" type="button" ${session.game.open.length===2?'':'hidden'}>${pt('hide')}</button><button class="button-primary" id="memory-results" type="button" ${session.game.matched.length===activity.pairs.length?'':'hidden'}>${pt('showResults')}</button></section><div class="activity-exit"><a class="button-secondary" href="${learningURL('games',{grade:activity.grade})}">${pt('exit')}</a><a class="button-secondary" href="${learningURL('game',{grade:activity.grade,activity:activity.id})}">${pt('restart')}</a></div><p class="activity-disclaimer">${pt('demo')} ${pt('memoryMetric')}${canStoreSession()?'':` ${pt('storage')}`}</p>`;
  cards.filter(card=>card.image&&(session.game.open.includes(card.id)||session.game.matched.includes(card.pair))).forEach(card=>{
   const picture=document.createElement('span');picture.className='memory-picture';picture.innerHTML=activityIllustration(card.image,card.text);root.querySelector(`[data-memory="${card.id}"]`).prepend(picture);
  });
  root.querySelectorAll('[data-memory]').forEach(button=>button.addEventListener('click',()=>{
   if(session.game.open.length>=2||session.game.open.includes(button.dataset.memory))return;
   session.game.open.push(button.dataset.memory);session.game.message='';
   if(session.game.open.length===2){
    const [a,b]=session.game.open.map(id=>cards.find(card=>card.id===id));
    const correct=a.pair===b.pair;
    session.records.push({id:`move-${session.records.length+1}`,topic:correct?a.text:`${a.text} / ${b.text}`,explanation:correct?`${a.text} ↔ ${b.text}`:activity.pairs.map(pair=>`${pair.left} ↔ ${pair.right}`).join('; '),hintsUsed:0,attempts:[{answer:`${a.text} ↔ ${b.text}`,correct}]});
    session.game.message=correct?'matched':'notMatched';
    if(correct){session.game.matched.push(a.pair);session.game.open=[];}
    else timer=setTimeout(hide,1400);
   }
   saveSession(session);draw();
   root.querySelector('#memory-message').setAttribute('tabindex','-1');
   if(session.game.matched.length===activity.pairs.length)root.querySelector('#memory-results').focus();
   else (root.querySelector(`[data-memory="${button.dataset.memory}"]:not(:disabled)`)??root.querySelector('[data-memory]:not(:disabled)'))?.focus();
  }));
  root.querySelector('#hide-memory').addEventListener('click',hide);
  root.querySelector('#memory-results').addEventListener('click',()=>finishActivity(root,activity,session));
 }
 draw();return ()=>{disposed=true;clearTimeout(timer);};
}
