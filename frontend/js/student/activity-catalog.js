import {bootLearningPage} from './learning-page.js';
import {getPractices} from '../services/practice.service.js';
import {getGames} from '../services/game.service.js';
import {getUnit,ContentNotFoundError} from '../services/course.service.js';
import {listSessions} from '../services/activity-session.service.js';
import {renderPracticeCard} from '../components/practice-card.js';
import {emptyState,escapeHTML as esc} from '../components/student-ui.js';
import {text} from './i18n.js';
import {pt} from './practice-i18n.js';
import {learningURL} from './learning-routes.js';

export function startActivityCatalog(kind){
 const filters={course:'all',difficulty:'all',state:'all'};
 return bootLearningPage(async route=>{
  const items=await(kind==='game'?getGames(route.grade):getPractices(route.grade));
  if(route.course){if(!items.some(item=>item.courseId===route.course))throw new ContentNotFoundError();filters.course=route.course;}
  if(route.unit){const {unit}=await getUnit(route.grade,route.course,route.unit);if(route.lesson&&!unit.lessonIds.includes(route.lesson))throw new ContentNotFoundError();}
  return items;
 },(items,route)=>{
  const root=document.querySelector('#learning-content');
  const sessions=listSessions().filter(session=>session.grade===route.grade&&session.kind===kind);
  const done=new Set(sessions.filter(session=>session.status==='completed').map(session=>session.activityId));
  const subjects=[...new Map(items.map(item=>[item.courseId,text(item.courseName)])).entries()];
  document.title=`${pt(kind==='game'?'gamesTitle':'practiceTitle')} | EDUNEXT`;
  root.innerHTML=`<header class="activity-catalog-header"><div><span class="eyebrow-light">EDUNEXT ${kind==='game'?'JUEGOS':'PRACTICA'}</span><h1>${pt(kind==='game'?'gamesTitle':'practiceTitle')}</h1><p>${pt(kind==='game'?'gamesSub':'practiceSub')}</p></div><label for="activity-grade">${route.grade}.º<select id="activity-grade" aria-label="Grado de muestra">${[4,5,6].map(grade=>`<option value="${grade}" ${grade===route.grade?'selected':''}>${grade}.º primaria</option>`).join('')}</select></label></header><dl class="catalog-metrics activity-catalog-metrics"><div><dt>${pt('activities')}</dt><dd>${items.length}</dd></div><div><dt>${pt('completed')}</dt><dd>${done.size}</dd></div><div><dt>${pt('questions')}</dt><dd>${items.reduce((sum,item)=>sum+(item.type==='memory'?item.pairs.length:item.questions.length),0)}</dd></div></dl><div class="catalog-filters activity-filters"><label>${pt('course')}<select id="filter-course"><option value="all">${pt('all')}</option>${subjects.map(([id,name])=>`<option value="${id}" ${filters.course===id?'selected':''}>${esc(name)}</option>`).join('')}</select></label><label>${pt('difficulty')}<select id="filter-difficulty">${['all','easy','intermediate','advanced'].map(value=>`<option value="${value}" ${filters.difficulty===value?'selected':''}>${pt(value)}</option>`).join('')}</select></label><label>${pt('state')}<select id="filter-state">${[['all','allStates'],['available','available'],['done','done']].map(([value,key])=>`<option value="${value}" ${filters.state===value?'selected':''}>${pt(key)}</option>`).join('')}</select></label></div><p class="catalog-result" id="activity-count" role="status"></p><section class="practice-grid" id="activity-grid" aria-label="${pt('activities')}"></section><div class="catalog-links"><a class="button-secondary" href="${learningURL(kind==='game'?'practice':'games',route)}">${pt(kind==='game'?'practiceTitle':'games')}</a><a class="button-secondary" href="${learningURL('catalog',route)}">Aprende</a></div><p class="activity-disclaimer">${pt('demo')} ${pt('offline')}</p>`;
  function update(){
   const visible=items.filter(item=>(filters.course==='all'||filters.course===item.courseId)&&(filters.difficulty==='all'||filters.difficulty===item.difficulty)&&(filters.state==='all'||(filters.state==='done'?done.has(item.id):item.available&&!done.has(item.id))));
   root.querySelector('#activity-grid').innerHTML=visible.length?visible.map(activity=>{
    const attempt=[...sessions].reverse().find(session=>session.activityId===activity.id&&session.status==='in-progress');
    return renderPracticeCard(activity,{completed:done.has(activity.id)&&!attempt,run:attempt?.id,originLesson:route.course===activity.courseId?route.lesson:undefined});
   }).join(''):emptyState(pt('noActivities'));
   root.querySelector('#activity-count').textContent=`${visible.length} / ${items.length} · ${pt('activities')}`;
  }
  ['course','difficulty','state'].forEach(key=>root.querySelector('#filter-'+key).addEventListener('change',event=>{filters[key]=event.target.value;update();}));
  root.querySelector('#activity-grade').addEventListener('change',event=>location.assign(learningURL(kind==='game'?'games':'practice',{grade:Number(event.target.value)})));
  update();
 },{active:kind==='game'?'games':'practice',demoMessage:()=>pt('demo')});
}
