import {assignedCourse} from './monitor-courses.service.js';
import {contentResources} from './monitor-resources.service.js';
import {getAll} from '../offline/database.js';
import {monitor} from '../data/monitor-demo.data.js';
import {blockTypes} from '../data/lesson-block-types.data.js';
import {dictionaryEntries} from '../data/dictionary-demo.data.js';
export function resourceRefs(d){return [...new Set([...(d.resourceIds||[]),...(d.blocks||[]).flatMap(b=>[b.content.resourceId,b.content.audioId].filter(Boolean))])];}
export async function validateContent(d){
 const errors=[],warnings=['Revisión pedagógica y de accesibilidad manual pendiente. La validación local no constituye aprobación institucional.'];
 const add=(field,message)=>errors.push({field,message});
 let c;try{c=await assignedCourse(d.grade,d.courseId);}catch(e){add('courseId',e.message);}
 if(!/^(unit|lesson)-draft-[a-z0-9-]+$/.test(d.id||''))add('id','Identificador estable de borrador no válido.');
 if(!['unit','lesson'].includes(d.kind))add('kind','Tipo de borrador no válido.');
 if(typeof d.title!=='string'||!d.title.trim()||d.title.length>160)add('title','Escribe un título de 1 a 160 caracteres.');
 if(typeof d.objective!=='string'||d.objective.trim().length<10||d.objective.length>2000)add('objective','Describe el objetivo pedagógico entre 10 y 2000 caracteres.');
 if(!Number.isInteger(d.order)||d.order<1||d.order>10000)add('order','El orden debe ser un entero positivo (máximo 10000).');
 if(!Number.isInteger(d.duration)||d.duration<1||d.duration>240)add('duration','La duración debe estar entre 1 y 240 minutos.');
 const strings=v=>typeof v==='string'?[v]:Array.isArray(v)?v.flatMap(strings):v&&typeof v==='object'?Object.values(v).flatMap(strings):[];
 if(strings(d).some(s=>s.length>10000))add('content','El contenido excede el máximo de 10000 caracteres por campo.');
 if(strings(d).some(s=>/<\/?[a-z][^>]*>|javascript\s*:|<\s*script/i.test(s)))add('content','Utiliza texto sin etiquetas HTML ni código ejecutable.');
 const drafts=(await getAll('monitorContentDrafts')).filter(r=>r.owner===monitor.id),scope=drafts.filter(r=>r.id!==d.id&&r.kind===d.kind&&r.courseId===d.courseId&&r.grade===d.grade&&r.state!=='archived'&&(d.kind==='unit'||r.unitId===d.unitId));
 if(scope.some(r=>r.title.trim().toLocaleLowerCase('es')===d.title?.trim().toLocaleLowerCase('es')))add('title','Ya existe un borrador con este título en la misma ubicación.');
 if(scope.some(r=>r.order===d.order))add('order','Este orden ya pertenece a otro borrador de la misma ubicación.');
 const baseItems=d.kind==='unit'?c?.units:c?.units.find(u=>u.id===d.unitId)?.lessons;
 if(baseItems?.some(x=>x.number===d.order))add('order','El orden pertenece al catálogo base. Utiliza una posición nueva para la propuesta.');
 if(d.baseId){const base=(d.kind==='unit'?c?.units:c?.units.flatMap(u=>u.lessons))?.find(x=>x.id===d.baseId);if(!base||d.baseVersion!==1)add('baseId','La referencia o versión del contenido base no es compatible.');}
 const resources=await contentResources(),compatible=r=>(!r.grade||r.grade===d.grade)&&(!r.courseId||r.courseId===d.courseId);
 const evaluations=(await getAll('monitorEvaluations')).filter(e=>e.owner===monitor.id);
 for(const ref of d.evaluationRefs||[]){const e=evaluations.find(e=>e.id===ref.id);if(!e||e.grade!==d.grade||e.course!==c?.name.es||e.state==='archived'||e.version!==ref.version)add('evaluationRefs','La evaluación referenciada cambió de versión o no es compatible.');}
 for(const id of resourceRefs(d)){const r=resources.find(r=>r.id===id);if(!r||!compatible(r))add('resources','Recurso inexistente o incompatible: '+id);else if(d.resourceVersions?.[id]&&d.resourceVersions[id]!==r.version)add('resources','La versión del recurso cambió: '+id);}
 if(d.kind==='unit'){
  for(const id of d.lessonIds||[]){const l=c?.units.flatMap(u=>u.lessons).find(l=>l.id===id)||drafts.find(l=>l.id===id&&l.kind==='lesson'&&l.unitId===d.id&&l.grade===d.grade&&l.courseId===d.courseId);if(!l)add('lessonIds','La lección vinculada no pertenece a esta unidad/curso: '+id);}
 }else{
  const unit=c?.units.find(u=>u.id===d.unitId)||drafts.find(u=>u.id===d.unitId&&u.kind==='unit'&&u.grade===d.grade&&u.courseId===d.courseId&&u.state!=='archived');
  if(!unit)add('unitId','Selecciona una unidad válida del curso y grado.');
  if(!Array.isArray(d.blocks)||!d.blocks.length)add('blocks','Añade al menos un bloque de contenido útil.');
  if(Array.isArray(d.blocks)&&d.blocks.length&&!d.blocks.some(b=>b.type!=='heading'))add('blocks','Un título por sí solo no constituye contenido útil. Añade una explicación, recurso o actividad.');
  if(d.blocks?.length>100)add('blocks','Máximo 100 bloques por lección.');
  const ids=new Set();let heading=1;
  for(const [i,b] of (d.blocks||[]).entries()){
   const name=`Bloque ${i+1}`;
   if(!/^block-[a-z0-9-]+$/.test(b.id||'')||ids.has(b.id)||b.lessonId!==d.id||b.order!==i+1)add('blocks',name+': ID, relación u orden no válido.');ids.add(b.id);
   if(!Object.hasOwn(blockTypes,b.type)||!b.content||typeof b.content!=='object'){add('blocks',name+': esquema no compatible.');continue;}
   const v=b.content;
   for(const key of Object.keys(blockTypes[b.type].fields)){const array=key==='items'||key==='entryIds';if(array?!Array.isArray(v[key]):key==='level'?!Number.isInteger(v[key]):typeof v[key]!=='string')add('blocks',name+': campo no compatible '+key);}
   const required={heading:['text'],paragraph:['text'],callout:['text'],example:['problem','explanation','steps','result'],image:['resourceId','alt'],audio:['resourceId','transcript'],reflection:['question','objective'],practice:['resourceId','purpose'],assessment:['resourceId','purpose'],resource:['resourceId'],summary:['ideas']}[b.type]||[];
   for(const field of required)if(typeof v[field]!=='string'||!v[field].trim())add('blocks',name+': completa '+(blockTypes[b.type].fields[field]||field)+'.');
   if(b.type==='heading'){if(![2,3].includes(v.level)||v.level>heading+1)add('blocks',name+': usa un encabezado de nivel 2 antes del nivel 3.');heading=v.level;}
   if(b.type==='vocabulary'&&(!v.entryIds?.length||v.entryIds.some(id=>!dictionaryEntries.some(w=>w.id===id))))add('blocks',name+': selecciona entradas del diccionario existente.');
   if(b.type==='concepts'&&(!v.items?.length||v.items.some(x=>!x.concept?.trim()||!x.description?.trim()||x.concept.length>160||x.description.length>2000)))add('blocks',name+': completa conceptos y descripciones.');
   if(v.resourceId){const r=resources.find(r=>r.id===v.resourceId),type={image:'image',audio:'audio',practice:'practice',assessment:'practice'}[b.type];if(type&&r?.type!==type)add('blocks',name+': tipo de recurso incompatible.');if(r&&b.resourceVersions?.[r.id]!==r.version)add('blocks',name+': la versión referenciada cambió o falta.');}
   if(v.audioId&&resources.find(r=>r.id===v.audioId)?.type!=='audio')add('blocks',name+': el audio de vocabulario no es válido.');
  }
 }
 if(!d.competency)warnings.push('Competencia no definida; requiere revisión curricular docente.');
 return {errors,warnings,checkedAt:new Date().toISOString(),valid:errors.length===0};
}
