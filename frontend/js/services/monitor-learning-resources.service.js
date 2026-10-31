import {getCoursesDemo} from '../data/courses-demo.data.js';
import {getUnitsDemo} from '../data/units-demo.data.js';
import {getPracticesDemo} from '../data/practices-demo.data.js';
import {getGamesDemo} from '../data/games-demo.data.js';
import {dictionaryEntries} from '../data/dictionary-demo.data.js';
import {getAll,put} from '../offline/database.js';
import {prepareStaticResources,MONITOR_CACHE} from '../offline/monitor-preparation.js';
export const resourceTypes={lesson:'📘 Lección',practice:'✏️ Práctica',review:'↩ Repaso',vocabulary:'🌐 Vocabulario',guided:'☰ Actividad guiada',game:'🎲 Juego educativo',tutor:'✦ Explicación predefinida del Tutor'};
const cache=new Map(),base=new URL('../../',import.meta.url);
export function learningResources(grade){
 if(![4,5,6].includes(Number(grade)))return [];
 grade=Number(grade);if(cache.has(grade))return cache.get(grade);
 const rows=[];
 for(const c of getCoursesDemo(grade))for(const unit of getUnitsDemo(c)){
  const common={grade,course:c.name.es,courseId:c.id,unitId:unit.id,theme:unit.title,version:1,difficulty:null};
  for(const lesson of unit.lessons){const params=new URLSearchParams({grade,course:c.id,unit:unit.id,lesson:lesson.id});rows.push({...common,id:'lesson:'+lesson.id,type:'lesson',name:lesson.title,description:lesson.objective,url:new URL('student/leccion.html?'+params,base).href,assets:[new URL(lesson.audio.src,new URL('student/',base)).href]});}
  const first=unit.lessons[0],params=new URLSearchParams({grade,course:c.id,unit:unit.id,lesson:first.id});
  for(const type of ['review','guided'])rows.push({...common,id:`${type}:${unit.id}`,type,name:`${type==='review'?'Repasar':'Actividad guiada'}: ${unit.title}`,description:type==='review'?'Volver a leer los conceptos de la unidad.':'Seguir las instrucciones docentes con una lección existente.',url:new URL('student/leccion.html?'+params,base).href,assets:[new URL(first.audio.src,new URL('student/',base)).href]});
  rows.push({...common,id:'tutor:'+first.id,type:'tutor',name:'Explicación predefinida: '+first.title,description:'Abre el contexto educativo del Tutor de demostración; no accede a chats privados ni usa IA generativa.',url:new URL('student/tutor.html?'+params,base).href,assets:[]});
  for(const word of dictionaryEntries.filter(w=>w.from==='es'&&w.to==='en'&&(w.topic===c.name.es||c.id==='english'&&w.topic===null)).slice(0,3))rows.push({...common,id:`vocabulary:${grade}:${c.id}:${word.id}`,type:'vocabulary',name:`${word.word} → ${word.translation}`,description:'Entrada revisada del diccionario local; las voces del navegador no están garantizadas offline.',url:new URL('student/palabra.html?'+new URLSearchParams({grade,word:word.word,from:word.from,to:word.to}),base).href,assets:[]});
 }
 for(const activity of [...getPracticesDemo(grade),...getGamesDemo(grade)])rows.push({id:activity.kind+':'+activity.id,type:activity.kind,name:activity.name,description:activity.description,grade,course:activity.courseName.es,courseId:activity.courseId,unitId:activity.unitId,theme:activity.topic,difficulty:activity.difficulty,version:1,url:new URL(`student/${activity.kind==='game'?'juego':'ejercicio'}.html?`+new URLSearchParams({grade,activity:activity.id}),base).href,assets:[]});
 cache.set(grade,rows);return rows;
}
export function resourceById(id,grade){return learningResources(grade).find(r=>r.id===id)||null;}
export async function resourceAvailability(resources){
 const metadata=await getAll('storageMetadata');const results=new Map();
 const local=typeof caches!=='undefined'?await caches.open(MONITOR_CACHE):null;
 for(const resource of resources){const record=metadata.find(m=>m.key===`learning-resource:${resource.id}:v${resource.version}`);let available=!!local&&!!record?.urls?.length;
  if(available)for(const url of record.urls){const response=await local.match(url);if(!response?.ok){available=false;break;}}
  results.set(resource.id,{available,verifiedAt:available?record.verifiedAt:null});
 }
 return results;
}
export async function prepareLearningResource(id,grade,onProgress){
 const resource=resourceById(id,grade);if(!resource)throw new Error('Recurso no encontrado para este grado.');
 const urls=await prepareStaticResources([resource.url,...resource.assets],onProgress);
 const local=await caches.open(MONITOR_CACHE);for(const url of urls)if(!(await local.match(url))?.ok)throw new Error('La verificación local del recurso no se completó.');
 await put('storageMetadata',{key:`learning-resource:${resource.id}:v${resource.version}`,urls,verifiedAt:new Date().toISOString()});
 return urls.length;
}
