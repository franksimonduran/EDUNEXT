import {bootLearningPage} from './learning-page.js';
import {getActivity} from './activity-model.js';
import {getSession} from '../services/activity-session.service.js';
import {ContentNotFoundError} from '../services/course.service.js';
import {renderActivityResults} from './activity-results-view.js';
import {learningURL} from './learning-routes.js';
import {pt} from './practice-i18n.js';
const gameResult=new URLSearchParams(location.search).get('activity')?.startsWith('game-');
bootLearningPage(async route=>{
 if(!route.activity||!route.run)return {missing:true};
 const activity=await getActivity(route,route.activity.startsWith('game-')?'game':'practice');
 const session=getSession(route.run);
 if(!session)return {missing:true};
 if(session.activityId!==activity.id||session.grade!==route.grade)throw new ContentNotFoundError();
 return {activity,session,missing:session.status!=='completed'};
},(model,route)=>{
 const root=document.querySelector('#learning-content');
 document.title=`${pt('finished')} | EDUNEXT`;
 if(model.missing){root.innerHTML=`<section class="dashboard-card not-found"><h1>${pt('noResult')}</h1><p>${pt('noResultNote')}</p><a class="button-secondary" href="${learningURL('practice',{grade:route.grade})}">${pt('back')}</a>${model.activity?`<a class="button-secondary" href="${learningURL(model.activity.kind==='game'?'game':'exercise',{...route})}">${pt('resume')}</a>`:''}</section>`;return;}
 renderActivityResults(root,model.activity,model.session);
},{active:gameResult?'games':'practice',demoMessage:()=>pt('demo')});
