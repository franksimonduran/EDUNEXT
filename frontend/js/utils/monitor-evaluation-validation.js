import {getCoursesDemo} from '../data/courses-demo.data.js';
import {getUnitsDemo} from '../data/units-demo.data.js';
export const types={multiple:'Selección múltiple',boolean:'Verdadero o falso',word:'Completar palabra o frase',numeric:'Respuesta numérica',matching:'Relacionar elementos',ordering:'Ordenar secuencias',image:'Identificar imagen',multi:'Varias respuestas',open:'Respuesta abierta'};
export const images=[{id:'../assets/images/branding/open-book.svg',label:'Libro abierto — recurso educativo local'},{id:'../assets/images/branding/mark.svg',label:'Símbolo de EDUNEXT'}];
export function courseUnits(grade,course){const c=getCoursesDemo(Number(grade)).find(c=>c.name.es===course);return c?getUnitsDemo(c):[];}
export function questionErrors(q){
 const errors=[];if(!q.id||!types[q.type])errors.push('Tipo o identificador no válido');if(!q.title?.trim()||q.title.length>1000)errors.push('Escribe un enunciado de hasta 1000 caracteres');
 if(!Number.isFinite(q.points)||q.points<=0||q.points>100)errors.push('El puntaje debe ser mayor que 0 y no superar 100');
 if(['multiple','boolean','multi','image'].includes(q.type)){
  if(!Array.isArray(q.options)||q.options.length<2||q.options.length>12||q.options.some(o=>!o.label?.trim())||new Set(q.options.map(o=>o.id)).size!==q.options.length)errors.push('Configura entre 2 y 12 opciones válidas con identificadores únicos');
  if(!q.correct?.length||q.correct.some(id=>!q.options?.some(o=>o.id===id))||new Set(q.correct).size!==q.correct.length||q.type!=='multi'&&q.correct.length!==1)errors.push('Selecciona las respuestas correctas válidas');
 }
 if(q.type==='boolean'&&(q.options?.length!==2||!q.options.some(o=>o.id==='true')||!q.options.some(o=>o.id==='false')))errors.push('Usa las opciones Verdadero y Falso');
 if(q.type==='word'&&(!q.correct?.length||q.correct.some(v=>!String(v).trim())))errors.push('Escribe una respuesta esperada');
 if(q.type==='numeric'&&(!q.correct?.length||!String(q.correct[0]).trim()||!Number.isFinite(Number(q.correct[0]))||!Number.isFinite(q.tolerance)||q.tolerance<0))errors.push('Indica un resultado numérico y tolerancia no negativa');
 if(q.type==='matching'&&(!q.pairs||q.pairs.length<2||q.pairs.some(p=>!p.left.trim()||!p.right.trim())||new Set(q.pairs.map(p=>p.right.trim())).size!==q.pairs.length||new Set(q.pairs.map(p=>p.left.trim())).size!==q.pairs.length||new Set(q.pairs.map(p=>p.id)).size!==q.pairs.length))errors.push('Añade al menos dos pares distintos y no ambiguos');
 if(q.type==='ordering'&&(!q.items||q.items.length<2||q.items.some(p=>!p.label.trim())||new Set(q.items.map(p=>p.label.trim())).size!==q.items.length||new Set(q.items.map(p=>p.id)).size!==q.items.length))errors.push('Añade al menos dos elementos distintos en su orden correcto');
 if(q.type==='image'&&(!images.some(i=>i.id===q.resource)||!q.alt?.trim()))errors.push('Selecciona un recurso local válido y escribe su texto alternativo');
 if(q.type==='open'&&(!q.rubric?.trim()||!q.criteria?.trim()))errors.push('Escribe criterios y una rúbrica para la revisión manual');
 return errors;
}
export function evaluationErrors(e,complete=false){
 const errors=[];const fields={};const add=(field,message)=>{fields[field]=message;errors.push({field,message});};
 if(!e.title?.trim()||e.title.length>160)add('title','Escribe un título de hasta 160 caracteres');
 if(![4,5,6].includes(Number(e.grade)))add('grade','Selecciona un grado válido');
 if(!courseUnits(e.grade,e.course).some(u=>u.id===e.unitId))add('unitId','Selecciona una unidad existente del curso y grado');
 for(const field of ['theme','objective','instructions'])if(!e[field]?.trim()||e[field].length>4000)add(field,'Completa este campo con un texto de hasta 4000 caracteres');
 if(!Number.isFinite(e.duration)||e.duration<=0||e.duration>240)add('duration','La duración debe ser de 1 a 240 minutos');
 if(!Number.isInteger(e.maxAttempts)||e.maxAttempts<1||e.maxAttempts>5)add('maxAttempts','Selecciona entre 1 y 5 intentos');
 if(complete){if(!e.questions?.length)add('questions','Añade al menos una pregunta');if(new Set(e.questions.map(q=>q.id)).size!==e.questions.length)add('questions','Hay identificadores de pregunta duplicados');e.questions.forEach((q,i)=>questionErrors(q).forEach(message=>errors.push({questionId:q.id,message:`Pregunta ${i+1}: ${message}`})));}
 return {errors,fields};
}
export function assignmentErrors(e,a,rooms){const errors=evaluationErrors(e,true).errors.map(e=>e.message);if(!a.rooms?.length||a.rooms.some(id=>!rooms.some(c=>c.id===id&&c.grade===Number(e.grade))))errors.push('Selecciona aulas asignadas compatibles con el grado');if(!a.start||!a.end||!Number.isFinite(Date.parse(a.start))||!Number.isFinite(Date.parse(a.end))||Date.parse(a.start)>=Date.parse(a.end))errors.push('La apertura debe ser anterior al cierre');if(!Number.isInteger(a.maxAttempts)||a.maxAttempts<1||a.maxAttempts>5)errors.push('Configura entre 1 y 5 intentos');if(!(a.duration>0&&a.duration<=240))errors.push('La duración debe ser de 1 a 240 minutos');if(a.start&&a.end&&Date.parse(a.end)-Date.parse(a.start)<a.duration*60000)errors.push('La ventana de fechas debe permitir la duración completa');return errors;}
export function publicQuestion(q){const {correct,explanation,rubric,criteria,modelAnswer,...publicData}=q;return publicData;}
