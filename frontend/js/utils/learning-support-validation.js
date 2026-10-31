import {subjects} from '../data/monitor-demo.data.js';
import {courseUnits} from './monitor-evaluation-validation.js';
import {resourceById} from '../services/monitor-learning-resources.service.js';
import {authorizedRooms,getStudent,queryStudents} from '../services/monitor-students.service.js';
export const taskTypes={lesson:'Lección',practice:'Práctica',review:'Repaso',guided:'Actividad guiada',vocabulary:'Vocabulario',game:'Juego educativo',reinforcement:'Refuerzo'};
export const categories={prior:'Conocimientos previos',practice:'Práctica',comprehension:'Comprensión',reading:'Lectura',personal:'Personalizado',group:'Grupal'};
export const completionRules={lesson:'Completar una lección',practice:'Finalizar una práctica',steps:'Revisar todos los pasos del refuerzo',guided:'Completar la actividad guiada de demostración'};
const markup=value=>/<\/?[a-z][^>]*>/i.test(String(value||''));
export function activityValidation(a){const fields={},errors=[];const add=(key,message)=>{fields[key]=message;errors.push(message);};
 for(const [key,label,max] of [['title','Título',160],['objective','Objetivo pedagógico',2000],['instructions','Instrucciones',4000],['theme','Tema',500]])if(!a[key]?.trim()||a[key].length>max||markup(a[key]))add(key,`${label}: escribe texto sin etiquetas HTML, de hasta ${max} caracteres.`);
 if(!['task','reinforcement'].includes(a.kind))add('kind','Tipo de actividad no válido.');
 if(!subjects.includes(a.course)||![4,5,6].includes(Number(a.grade)))add('course','Selecciona asignatura y grado válidos.');
 if(!courseUnits(a.grade,a.course).some(u=>u.id===a.unitId))add('unitId','Selecciona una unidad del curso y grado.');
 if(!Number.isFinite(a.estimatedMinutes)||a.estimatedMinutes<=0||a.estimatedMinutes>240)add('estimatedMinutes','El tiempo orientativo debe ser de 1 a 240 minutos.');
 if(!['easy','intermediate','advanced'].includes(a.difficulty))add('difficulty','Selecciona una dificultad válida.');
 if(!Object.hasOwn(taskTypes,a.type))add('type','Selecciona un tipo de tarea.');
 if(!a.resourceIds?.length||new Set(a.resourceIds).size!==a.resourceIds.length||a.resourceIds.some(id=>{const r=resourceById(id,a.grade);return !r||r.course!==a.course||r.unitId!==a.unitId;}))add('resourceIds','Selecciona recursos reales y compatibles con el curso, grado y unidad.');
 if(a.kind==='task'&&(a.type==='reinforcement'||!a.resourceIds?.some(id=>resourceById(id,a.grade)?.type===a.type)))add('resourceIds','Incluye al menos un recurso del tipo de tarea elegido.');
 if(a.kind==='reinforcement'){
  for(const key of ['reason','trackingCriterion'])if(!a[key]?.trim()||a[key].length>2000||markup(a[key]))add(key,'Escribe un motivo académico y un criterio de seguimiento, sin HTML.');
  if(!Object.hasOwn(categories,a.category))add('category','Selecciona una categoría de apoyo.');
  if(!a.steps?.length||new Set(a.steps.map(s=>s.id)).size!==a.steps.length)add('steps','Añade etapas con identificadores distintos.');
  for(const [i,step] of (a.steps||[]).entries())if(!step.title?.trim()||step.title.length>160||!step.description?.trim()||step.description.length>2000||markup(step.title)||markup(step.description)||!a.resourceIds.includes(step.resourceId)||step.minutes!==null&&(!Number.isFinite(step.minutes)||step.minutes<=0||step.minutes>240))add('steps',`Paso ${i+1}: completa título, descripción, recurso seleccionado y duración orientativa válida.`);
  if(a.suggestedDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(a.suggestedDate)||!Number.isFinite(Date.parse(a.suggestedDate))))add('suggestedDate','Escribe una fecha sugerida válida o deja el campo vacío.');
 }
 if(a.description?.length>4000||markup(a.description))add('description','Escribe una descripción de hasta 4000 caracteres sin HTML.');
 return {fields,errors};
}
export function assignmentRecipients(a,assignment){
 if(assignment.mode==='group')return [...new Set((assignment.rooms||[]).flatMap(room=>queryStudents({room}).map(s=>s.id)))];
 if(assignment.mode==='differentiated')return (assignment.groups||[]).flatMap(g=>g.studentIds);
 return assignment.studentIds||[];
}
export function assignmentValidation(a,c){const errors=[];
 if(!['group','individual','differentiated'].includes(c.mode))errors.push('Selecciona una modalidad válida.');
 if(c.mode==='group'&&(!c.rooms?.length||c.rooms.some(id=>!authorizedRooms().some(r=>r.id===id&&r.grade===a.grade))))errors.push('Selecciona aulas asignadas del mismo grado que la actividad.');
 const ids=assignmentRecipients(a,c);if(!ids.length||new Set(ids).size!==ids.length||ids.some(id=>getStudent(id)?.grade!==a.grade))errors.push('Selecciona destinatarios autorizados del grado, sin repetir estudiantes entre grupos.');
 if(c.mode==='differentiated'&&(!c.groups||c.groups.length<2||c.groups.some(g=>!g.studentIds.length||!g.resourceIds.length||g.resourceIds.some(id=>!a.resourceIds.includes(id)))))errors.push('Configura al menos dos grupos neutrales, con estudiantes distintos y recursos seleccionados para cada grupo.');
 if(c.mode==='differentiated'&&['lesson','practice'].includes(c.completion)&&c.groups.some(g=>!g.resourceIds.some(id=>resourceById(id,a.grade)?.type===c.completion)))errors.push('Cada grupo debe incluir un recurso compatible con su criterio de finalización.');
 if(c.mode==='differentiated'&&c.completion==='steps'&&c.groups.some(g=>a.steps.some(s=>!g.resourceIds.includes(s.resourceId))))errors.push('Cada grupo necesita los recursos de todas las etapas o un criterio guiado revisado por el docente.');
 const day=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T00:00:00-05:00'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
 if(!day(c.startDate)||!day(c.endDate)||c.startDate>c.endDate)errors.push('Selecciona fechas válidas de inicio y límite, en ese orden.');
 const time=value=>!value||/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
 if(!time(c.startTime)||!time(c.endTime)||c.startDate===c.endDate&&(!c.startTime||!c.endTime||c.startTime>=c.endTime))errors.push('Para el mismo día, indica ambas horas y un cierre posterior al inicio.');
 if(c.timezone!=='America/Lima')errors.push('La zona horaria de demostración debe ser America/Lima.');
 if(!Object.hasOwn(completionRules,c.completion)||c.completion==='steps'&&a.kind!=='reinforcement'||c.completion==='lesson'&&!a.resourceIds.some(id=>resourceById(id,a.grade)?.type==='lesson')||c.completion==='practice'&&!a.resourceIds.some(id=>resourceById(id,a.grade)?.type==='practice'))errors.push('Elige un criterio de finalización compatible con los recursos.');
 if(!['low','normal','high'].includes(c.priority))errors.push('Selecciona una prioridad organizativa válida.');
 return errors;
}
export function observationError(text){return !text?.trim()||text.length>2000||markup(text)?'Escribe una observación académica de 1 a 2000 caracteres, sin etiquetas HTML.':null;}
