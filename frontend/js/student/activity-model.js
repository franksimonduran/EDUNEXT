import {getPractice} from '../services/practice.service.js';
import {getGame} from '../services/game.service.js';
import {getUnit,ContentNotFoundError} from '../services/course.service.js';
import {getSession,newSession} from '../services/activity-session.service.js';
import {learningURL} from './learning-routes.js';

export async function getActivity(route,kind){return kind==='game'?getGame(route.grade,route.activity):getPractice(route.grade,route.activity);}
export async function loadAttempt(route,kind){
 const activity=await getActivity(route,kind);
 let session;
 if(route.run){
  session=getSession(route.run);
  if(!session||session.activityId!==activity.id||session.grade!==activity.grade||session.kind!==kind||!['in-progress','completed'].includes(session.status))throw new ContentNotFoundError();
 }else{
  let origin=activity.lessonId;
  if(route.lesson){const {unit}=await getUnit(route.grade,activity.courseId,activity.unitId);if(!unit.lessonIds.includes(route.lesson))throw new ContentNotFoundError();origin=route.lesson;}
  session=newSession(activity,origin);route.run=session.id;
  history.replaceState(null,'',learningURL(kind==='game'?'game':'exercise',{...route,activity:activity.id}));
 }
 if(!session.drafts||typeof session.drafts!=='object'||!session.game||typeof session.game!=='object'||!Number.isInteger(session.index)||session.index<0||session.index>=Math.max(1,activity.questions.length))throw new ContentNotFoundError();
 return {activity,session};
}
