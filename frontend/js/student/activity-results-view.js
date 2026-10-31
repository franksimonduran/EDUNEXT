import {renderResultSummary} from '../components/result-summary.js';
import {learningURL} from './learning-routes.js';
import {pt} from './practice-i18n.js';
import {canStoreSession} from '../services/activity-session.service.js';
export function renderActivityResults(root,activity,session){
 root.innerHTML=`${renderResultSummary(activity,session)}<nav class="result-actions" aria-label="${pt('finished')}"><a class="button-primary" data-restart href="${learningURL(activity.kind==='game'?'game':'exercise',{grade:activity.grade,activity:activity.id,lesson:session.originLesson})}">${pt('again')}</a><a class="button-secondary" href="${learningURL('practice',{grade:activity.grade})}">${pt('back')}</a><a class="button-secondary" href="${learningURL('lesson',{grade:activity.grade,course:activity.courseId,unit:activity.unitId,lesson:session.originLesson??activity.lessonId})}">${pt('lesson')}</a>${activity.kind==='game'?`<a class="button-secondary" href="${learningURL('games',{grade:activity.grade})}">${pt('games')}</a>`:''}</nav><p class="activity-disclaimer">${pt('demo')}</p>`;
 if(!canStoreSession()) {
  const status=document.createElement('p');status.className='work-status';status.setAttribute('role','status');status.textContent=pt('unsavedHere');root.prepend(status);
 }
}
