import {initEvaluations,listEvaluations,listAttempts} from './monitor-evaluations.service.js';
import {initSupport,listActivities,listAssignments,listRecords,activityState} from './monitor-tasks.service.js';
import {assignmentRecipients} from '../utils/learning-support-validation.js';
import {getStudent,authorizedRooms,normalize} from './monitor-students.service.js';
import {initOrganizer,listPersonal,getNotificationPreferences} from './monitor-organizer.service.js';
import {validCivil,civilFromInstant,civilInstant,todayCivil,addCivilDays} from '../utils/calendar-dates.js';
import {resultFor} from '../utils/monitor-grading.js';
export const eventTypes={evaluation:'Evaluación',task:'Tarea',reinforcement:'Refuerzo',session:'Sesión personal',reminder:'Recordatorio personal'};
export const eventStates={upcoming:'Próximo',pending:'Pendiente / Hoy',completed:'Completado localmente',overdue:'Fecha límite anterior (no prueba entrega)',past:'Anterior, sin finalizar automáticamente',unknown:'Sin datos suficientes'};
function boundary(date,time,sourceZone,zone){
 if(!date)return {date:null,time:null};
 if(date.includes('T'))return civilFromInstant(date,zone)||{date:null,time:null};
 if(!validCivil(date))return {date:null,time:null};
 return time?civilFromInstant(civilInstant(date,time,sourceZone),zone):{date,time:null};
}
function baseEvent({type,sourceId,title,description='',startDate=null,startTime=null,endDate=null,endTime=null,zone='America/Lima',...rest},displayZone){
 const start=boundary(startDate,startTime,zone,displayZone),end=boundary(endDate,endTime,zone,displayZone);
 return {id:type+':'+sourceId,type,sourceId,title,description,startDate:start.date,startTime:start.time,endDate:end.date,endTime:end.time,zone:displayZone,sourceZone:zone,sourceStartDate:startDate,sourceStartTime:startTime,localAvailable:true,...rest};
}
export function eventStatus(event,now=new Date()){
 if(event.completed)return 'completed';if(!validCivil(event.startDate))return 'unknown';const today=todayCivil(event.zone,now);
 if(event.endDate&&event.endDate<today)return 'overdue';
 if(event.type==='reminder'&&event.startDate<today)return 'overdue';
 if((event.endDate||event.startDate)<today)return 'past';
 if(event.startDate<=today&&(event.endDate||event.startDate)>=today)return 'pending';return 'upcoming';
}
export async function loadCalendar({now=new Date()}={}){
 await Promise.all([initEvaluations(),initSupport(),initOrganizer()]);
 const [evaluations,attempts,activities,assignments,records,sessions,reminders,preferences]=await Promise.all([listEvaluations(),listAttempts(),listActivities(),listAssignments(),listRecords(),listPersonal('session'),listPersonal('reminder'),getNotificationPreferences()]);
 const zone=preferences.zone,roomIds=new Set(authorizedRooms().map(r=>r.id)),events=[];
 for(const e of evaluations){if(e.state==='archived')continue;const a=e.assignment,rooms=(a?.rooms||[]).filter(id=>roomIds.has(id));if(a&&!rooms.length)continue;
  events.push(baseEvent({type:'evaluation',sourceId:e.id,title:e.title,description:e.description,startDate:a?.start,endDate:a?.end,grade:e.grade,course:e.course,rooms,sourceVersion:e.version,sourceRevision:e.revision,updatedAt:e.updatedAt,source:'Evaluación local de demostración',sourceRoute:'detalle-evaluacion',route:`editar-evaluacion.html?id=${encodeURIComponent(e.id)}`,reviewRoute:`entregas-evaluacion.html?id=${encodeURIComponent(e.id)}`,resourceIds:[],duration:e.duration,publication:'No publicada; planificación local',completed:false,reviewPending:attempts.filter(r=>r.evaluationId===e.id&&!resultFor(r).complete).length},zone));
 }
 for(const a of activities){if(a.state==='archived')continue;const assignment=assignments.find(c=>c.activityId===a.id&&c.activityVersion===a.version);const recipients=assignment?assignmentRecipients(a,assignment):[];const rooms=[...new Set(recipients.map(id=>getStudent(id)?.classroomId).filter(id=>roomIds.has(id)))];if(assignment&&!rooms.length)continue;const state=activityState(a,assignment,records.filter(r=>r.activityId===a.id&&r.activityVersion===a.version&&r.assignmentId===assignment?.id));
  events.push(baseEvent({type:a.kind==='reinforcement'?'reinforcement':'task',sourceId:a.id,title:a.title,description:a.description,startDate:assignment?.startDate,startTime:assignment?.startTime,endDate:assignment?.endDate,endTime:assignment?.endTime,zone:assignment?.timezone||'America/Lima',grade:a.grade,course:a.course,rooms,sourceVersion:a.version,sourceRevision:Math.max(a.revision,assignment?.revision||0),updatedAt:assignment?.updatedAt||a.updatedAt,source:'Actividad local',route:`detalle-actividad.html?id=${encodeURIComponent(a.id)}`,resourceIds:a.resourceIds,duration:a.estimatedMinutes,publication:'Configuración local; no recibida por estudiantes',completed:state==='finished'},zone));
 }
 for(const session of sessions){const room=authorizedRooms().find(r=>r.id===session.room);if(!room)continue;events.push(baseEvent({type:'session',sourceId:session.id,title:session.title,description:session.objective,startDate:session.date,startTime:session.time,zone:session.zone,rooms:[session.room],course:session.course,grade:room.grade,sourceVersion:session.revision,sourceRevision:session.revision,updatedAt:session.updatedAt,source:session.source==='fixture'?'Sesión ficticia de ejemplo':'Plan personal local',route:'planificacion-semanal.html?session='+encodeURIComponent(session.id)+'&date='+session.date,resourceIds:session.resourceIds,duration:session.duration,publication:'Sesión personal no distribuida',completed:false},zone));}
 for(const reminder of reminders){const room=authorizedRooms().find(r=>r.id===reminder.room);if(reminder.room&&!room)continue;events.push(baseEvent({type:'reminder',sourceId:reminder.id,title:reminder.title,description:reminder.description,startDate:reminder.date,startTime:reminder.time,zone:reminder.zone,rooms:reminder.room?[reminder.room]:[],grade:room?.grade||null,course:reminder.course||'',sourceVersion:reminder.revision,sourceRevision:reminder.revision,updatedAt:reminder.updatedAt,source:reminder.source==='fixture'?'Recordatorio ficticio de ejemplo':'Recordatorio personal local',route:'editar-recordatorio.html?id='+encodeURIComponent(reminder.id),resourceIds:[],duration:null,publication:'Solo este navegador',reference:reminder.reference,completed:reminder.state==='completed',color:reminder.color},zone));}
 return {events:[...new Map(events.map(e=>[e.id,{...e,status:eventStatus(e,now)}])).values()],preferences,zone,now,today:todayCivil(zone,now),source:'Datos locales de demostración; actualización del servidor desconocida'};
}
export function filterEvents(events,f={}){return events.filter(e=>(!f.room||e.rooms.includes(f.room))&&(!f.grade||String(e.grade)===String(f.grade))&&(!f.course||e.course===f.course)&&(!f.type||e.type===f.type)&&(!f.state||e.status===f.state)&&(!f.search||normalize(e.title+' '+e.description).includes(normalize(f.search))));}
export function occursOn(event,day){return validCivil(event.startDate)&&event.startDate<=day&&(event.endDate||event.startDate)>=day;}
export function sortEvents(events,sort='date-asc'){
 return [...events].sort((a,b)=>{if(!a.startDate||!b.startDate)return a.startDate?-1:b.startDate?1:a.title.localeCompare(b.title,'es');if(['type','course','state'].includes(sort)){const key=sort==='state'?'status':sort;const compare=(a[key]||'').localeCompare(b[key]||'','es');if(compare)return compare;}const diff=(a.startDate+(a.startTime||'99:99')).localeCompare(b.startDate+(b.startTime||'99:99'));return (sort==='date-desc'?-diff:diff)||a.id.localeCompare(b.id);});
}
export function calendarSummary(events,today){return {today:events.filter(e=>occursOn(e,today)).length,evaluations:events.filter(e=>e.type==='evaluation'&&e.startDate>=today).length,tasks:events.filter(e=>e.type==='task'&&validCivil(e.startDate)).length,reminders:events.filter(e=>e.type==='reminder'&&!e.completed).length};}
export function conflicts(events){const pairs=[];for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){const a=events[i],b=events[j];if(!a.startTime||!b.startTime||a.startDate!==b.startDate)continue;const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));const startA=minutes(a.startTime),startB=minutes(b.startTime);const endA=a.endDate===a.startDate&&a.endTime?minutes(a.endTime):a.type==='session'&&a.duration?startA+a.duration:null,endB=b.endDate===b.startDate&&b.endTime?minutes(b.endTime):b.type==='session'&&b.duration?startB+b.duration:null;if(endA!==null&&endB!==null&&startA<endB&&startB<endA)pairs.push([a,b]);}return pairs;}
export const eventDetailURL=id=>'detalle-evento.html?id='+encodeURIComponent(id);
