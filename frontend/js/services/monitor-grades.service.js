import {initEvaluations,listEvaluations,listAttempts} from './monitor-evaluations.service.js';
import {resultFor} from '../utils/monitor-grading.js';
import {academicPeriods,academicAnnotations,qualitativeScales} from '../data/monitor-academic-periods.data.js';
import {subjects} from '../data/monitor-demo.data.js';
import {authorizedRooms,getStudent,queryStudents,normalize} from './monitor-students.service.js';
import {academicSummary} from '../utils/academic-statistics.js';

export const gradeStates={
 'review-pending':'Pendiente de revisión','reviewed-demo':'Corregido en demostración',
 'published-demo':'Publicado de demostración — No oficial','progress-local':'En progreso local conocido',
 'final-local':'Finalizado localmente — Sin entrega confirmada',unavailable:'No disponible / Sin datos suficientes'
};
export const defaultFilters={room:'all',grade:'',course:'',period:'all',state:'',search:'',evaluation:'',student:'',activity:'all'};
export function dateInPeriod(value,period){
 if(period==='all')return true;
 if(!value||!Number.isFinite(Date.parse(value)))return period==='undated';
 if(period==='undated')return false;
 const p=academicPeriods.find(p=>p.id===period);if(!p)return false;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));
 const day=`${parts.year}-${parts.month}-${parts.day}`;
 return day>=p.start&&day<=p.end;
}
export function validateAcademicFilters(filters,data){
 const f={...defaultFilters,...filters};const errors=[];
 if(f.room!=='all'&&!authorizedRooms().some(c=>c.id===f.room))errors.push('Aula inexistente o fuera del ámbito demostrativo.');
 if(f.grade&&!['4','5','6'].includes(String(f.grade)))errors.push('Selecciona un grado válido.');
 if(f.course&&!subjects.includes(f.course))errors.push('Selecciona una asignatura válida.');
 if(!['all','undated',...academicPeriods.map(p=>p.id)].includes(f.period))errors.push('Selecciona un periodo académico válido.');
 if(f.state&&!Object.hasOwn(gradeStates,f.state))errors.push('Estado académico no válido.');
 if(!['all','evaluations','formative','progress'].includes(f.activity))errors.push('Tipo de actividad no válido.');
 if(f.evaluation&&!data.evaluations.some(e=>e.id===f.evaluation))errors.push('Evaluación inexistente o no disponible.');
 if(f.student){const student=getStudent(f.student);if(!student||f.room!=='all'&&student.classroomId!==f.room)errors.push('El estudiante no existe o no pertenece al aula seleccionada.');}
 return errors;
}
function academicRow(attempt,evaluation){
 const student=getStudent(attempt.studentId),snapshot=attempt.snapshot;
 const base={id:attempt.id,attemptId:attempt.id,evaluationId:attempt.evaluationId,version:attempt.version,reviewRevision:attempt.revision||0,studentId:attempt.studentId,classroomId:attempt.classroomId,alias:student.alias,grade:student.grade,title:snapshot?.title||evaluation.title,course:snapshot?.course||evaluation.course,theme:snapshot?.theme||evaluation.theme,unitId:snapshot?.unitId||evaluation.unitId,date:attempt.createdAt||null,reviewDate:attempt.updatedAt||null,valid:false,complete:false,score:null,max:null,percent:null,status:'unavailable',publication:'not-published',qualitative:null,breakdown:[],comments:[]};
 if(!snapshot||snapshot.id!==evaluation.id||snapshot.version!==attempt.version||snapshot.grade!==student.grade||!Array.isArray(snapshot.questions))return base;
 try{
  const result=resultFor(attempt);
  if(!Number.isFinite(result.max)||result.max<=0||result.rows.some(r=>r.score!==null&&(!Number.isFinite(r.score)||r.score<0||r.score>r.question.points)))return base;
  const state=attempt.state;
  const active=['in-progress-local','en-progreso','en-progreso-local'].includes(state),localFinal=['finalized-local','finalizada-local','finalizado-localmente'].includes(state);
  const complete=result.complete&&!active&&!localFinal;
  const annotation=academicAnnotations.find(a=>a.attemptId===attempt.id&&a.evaluationVersion===attempt.version&&a.reviewRevision===(attempt.revision||0));
  const published=complete&&annotation?.publication==='published-demo';
  return {...base,valid:true,complete,score:complete?result.score:null,max:result.max,percent:complete?result.percent:null,
   status:active?'progress-local':localFinal?'final-local':!result.complete?'review-pending':published?'published-demo':'reviewed-demo',
   publication:published?'published-demo':'not-published',publicationDate:published?annotation.publicationDate:null,
   qualitative:complete&&annotation?.qualitative&&qualitativeScales[annotation.qualitative.scale]?.levels.includes(annotation.qualitative.level)?annotation.qualitative:null,
   breakdown:result.rows.map(r=>({id:r.question.id,title:r.question.title,type:r.question.type,max:r.question.points,score:r.score,criteria:r.question.criteria||'',status:r.score===null?'Pendiente':'Revisada'})),
   comments:result.rows.filter(r=>r.comment).map(r=>({questionId:r.question.id,text:r.comment,date:attempt.updatedAt||null,source:'Comentario docente local de demostración'}))};
 }catch{return base;}
}
export async function loadAcademicData(){
 await initEvaluations();const evaluations=await listEvaluations();const attempts=await listAttempts();
 const rows=attempts.flatMap(a=>{const e=evaluations.find(e=>e.id===a.evaluationId);return e?[academicRow(a,e)]:[];});
 return {evaluations,rows,source:'Correcciones locales · Datos ficticios',loadedAt:new Date().toISOString()};
}
const stateMatches=(row,state)=>!state||state==='reviewed-demo'&&row.complete||row.status===state;
export function academicScope(data,filters={}){
 const f={...defaultFilters,...filters};const errors=validateAcademicFilters(f,data);
 if(errors.length)return {errors,filters:f,evaluations:[],rows:[],pupils:[],summary:academicSummary([],[])};
 let pupils=queryStudents({room:f.room,grade:String(f.grade||''),course:f.course});if(f.student)pupils=pupils.filter(s=>s.id===f.student);
 const pupilIds=new Set(pupils.map(s=>s.id));
 const targetRoom=f.student?getStudent(f.student).classroomId:f.room;
 let evaluations=data.evaluations.filter(e=>(!f.course||e.course===f.course)&&(!f.grade||String(e.grade)===String(f.grade))&&(!f.evaluation||e.id===f.evaluation)&&(!f.search||normalize(e.title+' '+e.theme).includes(normalize(f.search)))&&(targetRoom==='all'||e.assignment?.rooms.includes(targetRoom)||data.rows.some(r=>r.evaluationId===e.id&&r.classroomId===targetRoom)));
 evaluations=evaluations.filter(e=>dateInPeriod(e.assignment?.start||e.createdAt,f.period)||data.rows.some(r=>r.evaluationId===e.id&&dateInPeriod(r.date,f.period)&&pupilIds.has(r.studentId)));
 const ids=new Set(evaluations.map(e=>e.id));
 const baseRows=data.rows.filter(r=>ids.has(r.evaluationId)&&pupilIds.has(r.studentId)&&dateInPeriod(r.date,f.period));
 let rows=baseRows.filter(r=>stateMatches(r,f.state));
 if(f.state)evaluations=evaluations.filter(e=>rows.some(r=>r.evaluationId===e.id)||f.state==='unavailable'&&!data.rows.some(r=>r.evaluationId===e.id));
 if(['formative','progress'].includes(f.activity)){evaluations=[];rows=[];}
 return {errors:[],filters:f,evaluations,rows,baseRows,pupils,summary:academicSummary(evaluations,rows)};
}
export function gradeDetail(data,params){
 const row=data.rows.find(r=>r.id===params.attempt);if(!row)return null;
 if(params.student&&row.studentId!==params.student||params.evaluation&&row.evaluationId!==params.evaluation||params.version&&String(row.version)!==params.version||params.room&&params.room!=='all'&&row.classroomId!==params.room)return null;
 return row;
}
export function gradebook(scope,{studentSearch='',sort='alias'}={}){
 const pupils=scope.pupils.filter(s=>!studentSearch||normalize(s.alias+' '+s.id).includes(normalize(studentSearch))).sort((a,b)=>sort==='alias-desc'?b.alias.localeCompare(a.alias,'es',{numeric:true}):a.alias.localeCompare(b.alias,'es',{numeric:true}));
 return pupils.map(student=>{const cells=scope.evaluations.map(e=>{const results=scope.rows.filter(r=>r.studentId===student.id&&r.evaluationId===e.id);return {evaluation:e,results,filtered:!results.length&&(scope.baseRows||[]).some(r=>r.studentId===student.id&&r.evaluationId===e.id)};});return {student,cells,complete:cells.flatMap(c=>c.results).filter(r=>r.complete).length,pending:cells.flatMap(c=>c.results).filter(r=>r.status==='review-pending').length,missing:cells.filter(c=>!c.results.length&&!c.filtered).length};});
}
export function formativeFor(scope){
 if(['evaluations','progress'].includes(scope.filters.activity))return [];
 return scope.pupils.flatMap(s=>getStudent(s.id).history).filter(p=>(!scope.filters.course||p.course===scope.filters.course)&&dateInPeriod(p.date||null,scope.filters.period));
}
