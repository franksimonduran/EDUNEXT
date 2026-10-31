import {listActivities,listAssignments,listRecords,activityState} from './monitor-tasks.service.js';
import {assignmentRecipients} from '../utils/learning-support-validation.js';
import {getStudent,normalize} from './monitor-students.service.js';
import {loadAcademicData,academicScope} from './monitor-grades.service.js';
import {questionEvidence} from '../utils/academic-statistics.js';
export const trackingStates={unknown:'Sin registro disponible','active-local':'En progreso local conocido','finished-local':'Finalizada localmente — Demostración','reviewed-demo':'Revisada en demostración'};
export async function supportState(){const [activities,assignments,records]=await Promise.all([listActivities(),listAssignments(),listRecords()]);return {activities,assignments,records};}
export function trackingRows(data,activityId=''){
 return data.assignments.flatMap(assignment=>{const activity=data.activities.find(a=>a.id===assignment.activityId&&a.version===assignment.activityVersion);if(!activity||activityId&&activity.id!==activityId)return [];return assignmentRecipients(activity,assignment).flatMap(id=>{const student=getStudent(id);if(!student||student.grade!==activity.grade)return [];const records=data.records.filter(r=>r.assignmentId===assignment.id&&r.studentId===id&&r.activityVersion===activity.version);const latest=[...records].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];return [{id:assignment.id+'-'+id,activity,assignment,student,record:latest||null,state:latest?.state||'unknown'}];});});
}
export function filterTracking(rows,f={}){return rows.filter(r=>(!f.room||r.student.classroomId===f.room)&&(!f.course||r.activity.course===f.course)&&(!f.activity||r.activity.id===f.activity)&&(!f.state||r.state===f.state)&&(!f.date||r.record?.date?.slice(0,10)===f.date)&&(!f.search||normalize(r.student.alias+' '+r.student.id).includes(normalize(f.search)))).sort((a,b)=>f.sort==='date'?(b.record?.date||'').localeCompare(a.record?.date||''):a.student.alias.localeCompare(b.student.alias,'es',{numeric:true}));}
export function trackingSummary(rows){return {recipients:rows.length,known:rows.filter(r=>r.record).length,finished:rows.filter(r=>['finished-local','reviewed-demo'].includes(r.state)).length,pending:rows.filter(r=>r.state==='active-local').length,unknown:rows.filter(r=>r.state==='unknown').length};}
export async function supportSuggestions(context={}){
 const academic=await loadAcademicData(),scope=academicScope(academic,{room:context.room||'all',course:context.course||'',student:context.student||''});
 const evaluation=questionEvidence(scope.rows.filter(r=>r.complete)).filter(e=>e.errors>0).map(e=>({...e,id:e.key,source:'phase18-objective',rule:'Al menos una respuesta objetiva incorrecta en intentos completamente revisados.'}));
 const formative=scope.pupils.flatMap(s=>getStudent(s.id).observations.filter(o=>o.low>=2&&(!context.course||o.course===context.course)).map(o=>({id:`formative:${s.id}:${o.course}`,key:`formative:${s.id}:${o.course}`,source:'phase16-formative',grade:s.grade,course:o.course,theme:o.topic,n:o.rows.length,errors:o.low,studentCount:1,rule:'Dos prácticas formativas por debajo del 50 %. Sin fecha conocida; no es una calificación ni un diagnóstico.'})));
 return [...evaluation,...formative];
}
export async function reinforcementEvidence(activity,assignment){const data=await loadAcademicData();const ids=assignment?assignmentRecipients(activity,assignment):[];const rows=data.rows.filter(r=>r.complete&&ids.includes(r.studentId)&&r.course===activity.course);const day=r=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(r.date)).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;};return {before:rows.filter(r=>r.date&&assignment?.startDate&&day(r)<assignment.startDate),after:rows.filter(r=>r.date&&assignment?.endDate&&day(r)>assignment.endDate)};}
export {activityState};
