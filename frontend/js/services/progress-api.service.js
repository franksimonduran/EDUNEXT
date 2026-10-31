import {apiRequest} from './auth.service.js';

export const getOwnProgress=()=>apiRequest('/progress/me');
export const getOwnAchievements=()=>apiRequest('/progress/me/achievements');
export const getOwnHistory=(page=1)=>apiRequest(`/progress/me/history?page=${page}&page_size=25`);
export const completeOwnLesson=(lessonId,versionId)=>apiRequest(`/progress/lessons/${encodeURIComponent(lessonId)}/complete`,{
 method:'POST',body:{lesson_version_id:versionId},
});
export const getMonitorProgress=(classroomId,courseId,page=1)=>apiRequest(`/monitors/me/student-progress?classroom_id=${encodeURIComponent(classroomId)}&course_id=${encodeURIComponent(courseId)}&page=${page}`);

export function useProgressApi(){
 const mode=new URLSearchParams(location.search).get('modo');
 if(mode==='demo')return false;
 if(mode==='api')return true;
 try{return Boolean(sessionStorage.getItem('aithron.access_token'));}catch{return false;}
}
