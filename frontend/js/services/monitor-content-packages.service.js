import {prepareStaticResources,MONITOR_CACHE} from '../offline/monitor-preparation.js';
import {get,put} from '../offline/database.js';
import {contentResources,safeResourceURL} from './monitor-resources.service.js';
import {validateContent,resourceRefs} from './monitor-content-validation.service.js';
import {getDraft,listDrafts} from './monitor-content-drafts.service.js';
import {assignedCourse} from './monitor-courses.service.js';
const base=new URL('../../',import.meta.url);
export const studioViews=['cursos','detalle-curso','unidades','editar-unidad','lecciones','editar-leccion','recursos-educativos','vista-previa-leccion','organizar-contenidos'];
export async function prepareStudio(onProgress){return prepareStaticResources(studioViews.map(v=>new URL('monitor/'+v+'.html',base).href),onProgress);}
export async function packageManifest(d){
 const resources=await contentResources(),refs=resourceRefs(d),dependencies=[];
 if(d.kind==='unit'){
  const drafts=await listDrafts(),course=await assignedCourse(d.grade,d.courseId),ids=new Set([...(d.lessonIds||[]),...drafts.filter(l=>l.kind==='lesson'&&l.unitId===d.id&&l.state!=='archived').map(l=>l.id)]);
  for(const id of ids){const l=drafts.find(l=>l.id===id)||course.units.flatMap(u=>u.lessons).find(l=>l.id===id);if(!l){dependencies.push({id,revision:null});continue;}dependencies.push({id:l.id,revision:l.revision||1});refs.push(...(l.kind?resourceRefs(l):['audio:'+l.id]));}
 }
 return {entityId:d.id,revision:d.revision,version:d.version,dependencies,structuredData:'IndexedDB: monitorContentDrafts/'+d.id,resources:[...new Set(refs)].map(id=>{const r=resources.find(r=>r.id===id);return {id,version:r?.version||null,urls:r?[r.url,...r.assets||[]]:[]};}),state:'unverified'};
}
export async function verifyPackage(d){
 const manifest=await packageManifest(d),validation=await validateContent(d),errors=validation.errors.map(e=>e.message),record=await get('storageMetadata','studio-package:'+d.id);
 const persisted=await getDraft(d.id);if(!persisted||persisted.revision!==d.revision)errors.push('Los datos estructurados no corresponden a la revisión local guardada.');
 if(JSON.stringify(record?.dependencies||[])!==JSON.stringify(manifest.dependencies))errors.push('Las lecciones dependientes cambiaron o aún no se han preparado.');
 for(const dep of manifest.dependencies){const child=await getDraft(dep.id);if(child){const v=await validateContent(child);errors.push(...v.errors.map(e=>e.message));}else if(!dep.revision)errors.push('Lección dependiente no encontrada: '+dep.id);}
 if(!record||record.revision!==d.revision)errors.push('Esta revisión no se ha preparado en este dispositivo.');
 const local=typeof caches!=='undefined'?await caches.open(MONITOR_CACHE):null;
 for(const ref of manifest.resources){if(!ref.urls.length)errors.push('Recurso inexistente: '+ref.id);for(const url of ref.urls)if(!safeResourceURL(url)||!(await caches.match(url))?.ok)errors.push('Archivo no disponible offline: '+url);}
 for(const url of record?.urls||[])if(!(await local?.match(url))?.ok)errors.push('Archivo de aplicación o dependencia no disponible: '+url);
 return {...manifest,state:errors.length?'incomplete':'complete',errors,checkedAt:new Date().toISOString(),message:errors.length?'Preparación incompleta':'Preparación completa en este dispositivo'};
}
export async function prepareContentPackage(d,onProgress){
 const v=await validateContent(d);if(v.errors.length)throw new Error(v.errors.map(e=>e.message).join(' '));if(!d.revision)throw new Error('Guarda primero el borrador.');
 const current=await getDraft(d.id);if(current?.revision!==d.revision)throw new Error('La revisión cambió. Recarga antes de preparar recursos.');
 const manifest=await packageManifest(d),urls=await prepareStaticResources([...studioViews.map(v=>new URL('monitor/'+v+'.html',base).href),...manifest.resources.flatMap(r=>r.urls)],onProgress);
 await put('storageMetadata',{key:'studio-package:'+d.id,entityId:d.id,revision:d.revision,version:d.version,dependencies:manifest.dependencies,urls,verifiedAt:new Date().toISOString()});return verifyPackage(d);
}
