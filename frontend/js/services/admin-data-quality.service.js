import {organizationModel,studentsOfClassroom,enrollmentsOfClassroom} from '../utils/academic-relations.js';
import {loadAcademicData,academicScope} from './monitor-grades.service.js';
import {listAcademicRecords} from './admin-organization-drafts.service.js';
import {demoInstitution,demoTeachers} from '../data/admin-demo.data.js';
import {distinct} from '../utils/admin-statistics.js';
import {authorizedRooms,queryStudents} from './monitor-students.service.js';
import {assignedCourses} from './monitor-courses.service.js';
import {academicPeriods} from '../data/monitor-academic-periods.data.js';

export async function runQualityChecks(filters={}){
  const model=await organizationModel();
  const allRooms=(await import('./monitor-students.service.js')).authorizedRooms();
  const rooms=allRooms.filter(r=>(filters.grade==='all'||r.grade===Number(filters.grade))&&(filters.room==='all'||r.id===filters.room));
  const roomIds=new Set(rooms.map(r=>r.id));
  const allStudents=(await import('./monitor-students.service.js')).queryStudents();
  const students=distinct(allStudents.filter(s=>roomIds.has(s.classroomId)));
  const allCourses=await (await import('./monitor-courses.service.js')).assignedCourses();
  const courses=allCourses.filter(c=>c.rooms.some(r=>roomIds.has(r.id)));
  const academicData=await loadAcademicData();
  const scope=academicScope(academicData,{grade:filters.grade==='all'?'':filters.grade,room:filters.room,period:filters.period});
  const records=await listAcademicRecords();
  
  const issues=[];
  
  const studentIds=new Set(students.map(s=>s.id));
  const seenStudents=new Set();
  for(const s of students){
    if(seenStudents.has(s.id))issues.push({category:'users',rule:'uniqueId',severity:'error',description:`ID de estudiante duplicado: ${s.id}`,reference:s.id,status:'open'});
    seenStudents.add(s.id);
  }
  if(students.some(s=>!s.roles||s.roles.length===0))issues.push({category:'users',rule:'validRole',severity:'warning',description:'Estudiante sin roles asignados',reference:'students',status:'open'});
  
  for(const r of rooms){
    if(!Number.isInteger(r.grade)||r.grade<4||r.grade>6)issues.push({category:'rooms',rule:'validGrade',severity:'error',description:`Grado inválido en aula ${r.id}`,reference:r.id,status:'open'});
    if(!r.section)issues.push({category:'rooms',rule:'validSection',severity:'warning',description:`Aula sin sección: ${r.id}`,reference:r.id,status:'open'});
  }
  
  const enrollments=model.enrollments.filter(e=>roomIds.has(e.roomId));
  const enrByKey=new Map();
  for(const e of enrollments){
    const key=`${e.studentId}|${e.roomId}|${e.periodId||'none'}`;
    if(enrByKey.has(key))issues.push({category:'enrollments',rule:'noDuplicateEnrollment',severity:'warning',description:`Matrícula duplicada: ${e.studentId} en ${e.roomId}`,reference:key,status:'open'});
    enrByKey.set(key,e);
  }
  if(enrollments.some(e=>!studentIds.has(e.studentId)))issues.push({category:'enrollments',rule:'validStudent',severity:'error',description:'Matrícula referencia estudiante inexistente',reference:'enrollments',status:'open'});
  if(enrollments.some(e=>!roomIds.has(e.roomId)))issues.push({category:'enrollments',rule:'validRoom',severity:'error',description:'Matrícula referencia aula fuera del ámbito',reference:'enrollments',status:'open'});
  
  const assignments=model.assignments.filter(a=>roomIds.has(a.roomId));
  const assignByKey=new Map();
  for(const a of assignments){
    const key=`${a.monitorId}|${a.roomId}|${a.courseKey}|${a.periodId||'none'}`;
    if(assignByKey.has(key))issues.push({category:'assignments',rule:'noDuplicateAssignment',severity:'warning',description:`Asignación duplicada: ${a.monitorId} - ${a.roomId} - ${a.courseKey}`,reference:key,status:'open'});
    assignByKey.set(key,a);
  }
  if(assignments.some(a=>!demoTeachers.some(t=>t.id===a.monitorId)))issues.push({category:'assignments',rule:'validMonitor',severity:'warning',description:'Asignación referencia monitor inexistente',reference:'assignments',status:'open'});
  if(assignments.some(a=>!roomIds.has(a.roomId)))issues.push({category:'assignments',rule:'validRoom',severity:'warning',description:'Asignación referencia aula fuera del ámbito',reference:'assignments',status:'open'});
  
  const drafts=records.filter(r=>r.owner==='demo-admin'&&r.institutionId==='demo-institution'&&r.state!=='archived');
  for(const d of drafts){
    if(!d.data||!d.data.courseId)issues.push({category:'content',rule:'validCourse',severity:'warning',description:`Borrador sin curso: ${d.id}`,reference:d.id,status:'open'});
    if(!d.data||!d.data.grade)issues.push({category:'content',rule:'validGrade',severity:'warning',description:`Borrador sin grado: ${d.id}`,reference:d.id,status:'open'});
    if(d.type==='lesson'&&!d.data.unitId)issues.push({category:'content',rule:'validUnit',severity:'warning',description:`Lección sin unidad: ${d.id}`,reference:d.id,status:'open'});
    if(d.version!==undefined&&d.version!==null&&!Number.isInteger(d.version))issues.push({category:'content',rule:'versionConsistency',severity:'info',description:`Versión no entera en borrador: ${d.id}`,reference:d.id,status:'open'});
  }
  
  for(const e of scope.evaluations){
    if(!e.assignment||!e.assignment.start)issues.push({category:'evaluations',rule:'validState',severity:'warning',description:`Evaluación sin asignación o fecha: ${e.id}`,reference:e.id,status:'open'});
    if(!e.questions||e.questions.length===0)issues.push({category:'evaluations',rule:'validState',severity:'warning',description:`Evaluación sin preguntas: ${e.id}`,reference:e.id,status:'open'});
  }
  if(scope.summary.groups.some(g=>g.n<5))issues.push({category:'academic',rule:'nonZeroDenominator',severity:'info',description:'Evaluaciones con muestra pequeña (<5)',reference:'groups',status:'open'});
  
  const periodCovered=scope.evaluations.some(e=>e.assignment&&e.assignment.start);
  if(!periodCovered)issues.push({category:'availability',rule:'periodCovered',severity:'info',description:'Periodo sin fechas de asignación confirmadas',reference:filters.period,status:'open'});
  const datedRecords=records.filter(r=>r.updatedAt&&dateInPeriod(r.updatedAt,filters.period));
  if(datedRecords.length===0)issues.push({category:'availability',rule:'knownSource',severity:'info',description:'Sin registros con fecha en el periodo',reference:filters.period,status:'open'});
  
function dateInPeriod(value,period){
  if(period==='all')return true;
  if(!value||!Number.isFinite(Date.parse(value)))return period==='undated';
  if(period==='undated')return false;
  const p=academicPeriods.find(p=>p.id===period);if(!p)return false;
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));
  const day=`${parts.year}-${parts.month}-${parts.day}`;
  return day>=p.start&&day<=p.end;
}
  
  return {
    institution:demoInstitution,
    filters,
    generatedAt:new Date().toISOString(),
    summary:{total:issues.length,errors:issues.filter(i=>i.severity==='error').length,warnings:issues.filter(i=>i.severity==='warning').length,info:issues.filter(i=>i.severity==='info').length},
    issues,
    byCategory:{
      users:issues.filter(i=>i.category==='users'),
      rooms:issues.filter(i=>i.category==='rooms'),
      enrollments:issues.filter(i=>i.category==='enrollments'),
      assignments:issues.filter(i=>i.category==='assignments'),
      content:issues.filter(i=>i.category==='content'),
      evaluations:issues.filter(i=>i.category==='evaluations'),
      academic:issues.filter(i=>i.category==='academic'),
      availability:issues.filter(i=>i.category==='availability')
    },
    methodology:'Validaciones locales deterministas. No sustituye auditoría institucional.',
    limitations:['Solo validaciones automatizadas','Datos de demostración','No verifica integridad de archivos remotos']
  };
}

export function getQualitySummary(issues){
  return {
    total:issues.length,
    bySeverity:{
      error:issues.filter(i=>i.severity==='error').length,
      warning:issues.filter(i=>i.severity==='warning').length,
      info:issues.filter(i=>i.severity==='info').length
    },
    byCategory:{
      users:issues.filter(i=>i.category==='users').length,
      rooms:issues.filter(i=>i.category==='rooms').length,
      enrollments:issues.filter(i=>i.category==='enrollments').length,
      assignments:issues.filter(i=>i.category==='assignments').length,
      content:issues.filter(i=>i.category==='content').length,
      evaluations:issues.filter(i=>i.category==='evaluations').length,
      academic:issues.filter(i=>i.category==='academic').length,
      availability:issues.filter(i=>i.category==='availability').length
    }
  };
}