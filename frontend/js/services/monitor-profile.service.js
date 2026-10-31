import {monitor} from '../data/monitor-demo.data.js';
import {monitorPreferences,saveMonitorPreferences} from './monitor-settings.service.js';
import {authorizedRooms,getRoom} from './monitor-students.service.js';
import {assignedCourses} from './monitor-courses.service.js';
import {listDrafts} from './monitor-content-drafts.service.js';
import {listAttempts} from './monitor-evaluations.service.js';
import {resultFor} from '../utils/monitor-grading.js';
import {loadAcademicData} from './monitor-grades.service.js';
export function monitorIdentity(){const p=monitorPreferences();return {...monitor,role:'monitor',informationState:'demo',alias:p.alias||monitor.alias,avatar:p.avatar,greeting:p.greeting,avatarTone:p.avatarTone,institutionalAlias:monitor.alias};}
export async function monitorProfile(){await loadAcademicData();const rooms=authorizedRooms().map(r=>getRoom(r.id)),courses=await assignedCourses(),drafts=await listDrafts(),attempts=await listAttempts();return {...monitorIdentity(),rooms,courses,stats:{rooms:rooms.length,courses:courses.length,drafts:drafts.filter(d=>d.state==='draft').length,review:attempts.filter(a=>!resultFor(a).complete).length}};}
export function saveMonitorPersonalization({alias,avatar,greeting,avatarTone}){alias=String(alias||'').trim().replace(/\s+/g,' ');if(!alias)throw new Error('El alias no puede estar vacío.');return saveMonitorPreferences({alias,avatar,greeting,avatarTone});}
