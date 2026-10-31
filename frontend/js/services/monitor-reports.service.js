import {academicScope,formativeFor} from './monitor-grades.service.js';
import {authorizedRooms,getStudent} from './monitor-students.service.js';
import {subjects} from '../data/monitor-demo.data.js';
import {createDemoCsv} from '../utils/csv-safety.js';
import {gradeStates} from './monitor-grades.service.js';
import {academicSummary} from '../utils/academic-statistics.js';
export const reportTypes={classroom:'Reporte del Aula',course:'Reporte por Curso',student:'Reporte Individual',evaluations:'Reporte de Evaluaciones',activities:'Reporte de Actividades'};
export const reportIndicators={evaluations:'Resultados de evaluaciones',formative:'Prácticas formativas',progress:'Progreso curricular',observations:'Observaciones académicas'};
export function validateReport(config,data){
 const errors=[];const room=authorizedRooms().find(c=>c.id===config.room);
 if(!room)errors.push('Selecciona un aula asignada válida.');
 if(!Object.hasOwn(reportTypes,config.type))errors.push('Selecciona un tipo de reporte válido.');
 if(config.grade&&String(room?.grade)!==String(config.grade))errors.push('El grado debe corresponder al aula.');
 if(config.type==='course'&&!subjects.includes(config.course))errors.push('El reporte por curso requiere una asignatura.');
 const scope=academicScope(data,config);errors.push(...scope.errors);
 if(config.type==='student'&&(!getStudent(config.student)||getStudent(config.student).classroomId!==config.room))errors.push('Selecciona un estudiante perteneciente al aula.');
 if(!Array.isArray(config.indicators)||!config.indicators.length||config.indicators.some(i=>!Object.hasOwn(reportIndicators,i)))errors.push('Selecciona indicadores válidos para el reporte.');
 if(config.evaluationIds!==undefined&&(!Array.isArray(config.evaluationIds)||config.evaluationIds.some(id=>!scope.evaluations.some(e=>e.id===id))))errors.push('Hay evaluaciones fuera de los filtros elegidos.');
 if(Array.isArray(config.evaluationIds)&&new Set(config.evaluationIds).size!==config.evaluationIds.length)errors.push('No repitas evaluaciones en el reporte.');
 if(config.type!=='student'&&config.student)errors.push('El reporte de aula no debe incluir un filtro individual oculto.');
 return [...new Set(errors)];
}
export function buildReport(config,data){
 const errors=validateReport(config,data);if(errors.length)return {errors};
 const scope=academicScope(data,config);
 if(config.evaluationIds){scope.evaluations=scope.evaluations.filter(e=>config.evaluationIds.includes(e.id));scope.rows=scope.rows.filter(r=>config.evaluationIds.includes(r.evaluationId));}
 scope.summary=academicSummary(scope.evaluations,scope.rows);
 const formative=formativeFor(scope);
 const hasOtherData=config.indicators.includes('formative')&&formative.length>0||config.indicators.includes('progress')&&scope.pupils.length>0;
 const state=scope.rows.length?scope.rows.some(r=>!r.complete)?'Generado localmente — Datos parciales, pendiente de revisión':scope.summary.represented<scope.pupils.length?'Generado localmente — Datos parciales, muestra limitada':'Generado localmente — Demostración':hasOtherData?'Generado localmente — Sin resultados de evaluación para estos filtros':'Sin datos para los indicadores y filtros elegidos';
 return {errors:[],id:'report-'+crypto.randomUUID(),generatedAt:new Date().toISOString(),version:1,source:data.source,config,scope,formative,state};
}
export function gradebookCsv(records,filters){
 const rows=[['Datos de demostración — No oficial'],['Periodo',filters.period,'Curso',filters.course||'Todos'],['Código ficticio','Alias','Aula','Evaluación','Versión','Puntaje obtenido','Puntaje máximo','Porcentaje','Estado']];
 for(const record of records)for(const cell of record.cells){
  if(!cell.results.length)rows.push([record.student.id,record.student.alias,record.student.classroomId,cell.evaluation.title,cell.evaluation.version,'','','',cell.filtered?'Sin coincidencias con el estado seleccionado':'Sin intento recibido o accesible en esta muestra; estado remoto desconocido']);
  for(const result of cell.results)rows.push([record.student.id,record.student.alias,result.classroomId,result.title,result.version,result.score??'',result.max??'',result.percent??'',gradeStates[result.status]]);
 }
 return createDemoCsv(rows);
}
