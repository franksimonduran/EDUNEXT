import {openAithronDb,getAll,get} from '../offline/database.js';
import {monitor} from '../data/monitor-demo.data.js';
import {assignedCourse} from './monitor-courses.service.js';
import {validateContent,resourceRefs} from './monitor-content-validation.service.js';
import {contentId} from '../data/lesson-block-types.data.js';
import {contentResources} from './monitor-resources.service.js';
export async function listDrafts(){return (await getAll('monitorContentDrafts')).filter(d=>d.owner===monitor.id);}
export async function getDraft(id){const d=await get('monitorContentDrafts',id);return d?.owner===monitor.id?d:null;}
export async function createDraft(kind,grade,courseId,unitId=''){
 if(kind==='unit')unitId='';
 const c=await assignedCourse(grade,courseId),existing=await listDrafts(),siblings=existing.filter(d=>d.kind===kind&&d.courseId===courseId&&d.grade===Number(grade)&&d.state!=='archived'&&(kind==='unit'||d.unitId===unitId));
 const baseOrders=kind==='unit'?c.units.map(u=>u.number):(c.units.find(u=>u.id===unitId)?.lessons||[]).map(l=>l.number);
 return {id:contentId(kind+'-draft'),kind,grade:Number(grade),courseId,unitId,owner:monitor.id,title:'',description:'',theme:'',objective:'',order:Math.max(0,...baseOrders,...siblings.map(d=>d.order))+1,duration:10,competency:'',capacity:'',criteria:'',evidence:'',teacherNotes:'',priorKnowledge:'',instructions:'',complexity:'basic',resourceIds:[],lessonIds:[],evaluationRefs:[],blocks:[],state:'draft',revision:0,version:1,origin:'local',baseId:null,baseVersion:null};
}
export async function saveDraft(d,{ready=false,archive=false}={}){
 const previous=await getDraft(d.id);if(previous&&(previous.grade!==d.grade||previous.courseId!==d.courseId||previous.kind!==d.kind||previous.unitId!==d.unitId))throw new Error('La ubicación de un borrador guardado es estable. Crea otra propuesta para cambiarla.');
 if(archive&&d.kind==='unit'&&(await listDrafts()).some(l=>l.kind==='lesson'&&l.unitId===d.id&&l.state!=='archived'))throw new Error('Archiva primero las lecciones locales dependientes de esta unidad.');
 const validation=await validateContent(d);if(validation.errors.length)throw new Error(validation.errors.map(e=>e.message).join(' '));
 const resources=await contentResources(),resourceVersions=Object.fromEntries(resourceRefs(d).map(id=>[id,resources.find(r=>r.id===id)?.version]));
 const db=await openAithronDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['monitorContentDrafts','monitorContentVersions'],'readwrite'),store=tx.objectStore('monitorContentDrafts');let message='No se pudo guardar el borrador. Revisa el almacenamiento y reintenta.';let next;
  const req=store.get(d.id);req.onsuccess=()=>{
   const old=req.result;if(old&&(old.owner!==monitor.id||old.revision!==d.revision||old.state==='archived')){message='El borrador cambió en otra pestaña o está archivado. Recarga o duplica antes de editar.';tx.abort();return;}
   if(!old&&d.revision){message='El borrador ya no existe. Recupera el catálogo antes de guardar.';tx.abort();return;}
   const check=store.getAll();check.onsuccess=()=>{
    const rows=check.result.filter(x=>x.owner===monitor.id),siblings=rows.filter(x=>x.id!==d.id&&x.kind===d.kind&&x.courseId===d.courseId&&x.grade===d.grade&&x.state!=='archived'&&(d.kind==='unit'||x.unitId===d.unitId));
    const duplicate=siblings.some(x=>x.order===d.order||x.title.trim().toLocaleLowerCase('es')===d.title.trim().toLocaleLowerCase('es'));
    const parent=d.kind==='lesson'&&d.unitId.startsWith('unit-draft-')?rows.find(x=>x.id===d.unitId&&x.kind==='unit'&&x.state!=='archived'):true;
    const children=archive&&d.kind==='unit'&&rows.some(x=>x.unitId===d.id&&x.state!=='archived');
    if(duplicate||!parent||children){message='Las relaciones o el orden cambiaron en otra pestaña. Recarga antes de guardar.';tx.abort();return;}
    next={...structuredClone(d),resourceVersions,owner:monitor.id,state:archive?'archived':ready?'ready':'draft',validation,revision:(old?.revision||0)+1,version:(old?.version||0)+1,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    store.put(next);tx.objectStore('monitorContentVersions').add({id:next.id+':'+next.revision,entityId:next.id,owner:monitor.id,version:next.version,createdAt:next.updatedAt,state:next.state,snapshot:structuredClone(next)});
   };
  };
  tx.oncomplete=()=>{db.close();resolve(next);};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(message));};
 });
}
export async function versionsFor(id){if(!await getDraft(id))return [];return (await getAll('monitorContentVersions')).filter(v=>v.owner===monitor.id&&v.entityId===id).sort((a,b)=>b.version-a.version);}
export async function restoreVersion(id,version){const current=await getDraft(id),v=(await versionsFor(id)).find(v=>v.version===version);if(!current||!v)throw new Error('Versión local no encontrada.');return saveDraft({...v.snapshot,revision:current.revision,state:'draft'});}
export async function duplicateDraft(id){const d=await getDraft(id);if(!d)throw new Error('Borrador no encontrado.');const next=await createDraft(d.kind,d.grade,d.courseId,d.unitId),copy={...structuredClone(d),id:next.id,title:d.title.slice(0,120)+' — Copia '+next.id.slice(-6),order:next.order,state:'draft',revision:0,version:1,lessonIds:[],createdAt:undefined,updatedAt:undefined};copy.blocks=copy.blocks.map(b=>({...b,id:contentId('block'),lessonId:copy.id}));return saveDraft(copy);}
export async function dependenciesFor(d){const drafts=await listDrafts(),activities=await getAll('monitorActivities'),packages=await getAll('storageMetadata');return [...drafts.filter(x=>x.id!==d.id&&(x.unitId===d.id||x.lessonIds?.includes(d.id))).map(x=>({type:'Borrador',id:x.id,title:x.title})),...activities.filter(a=>a.owner===monitor.id&&(a.resourceIds?.includes('lesson:'+d.id)||a.contentDraftId===d.id)).map(a=>({type:'Tarea / refuerzo',id:a.id,title:a.title})),...packages.filter(p=>p.entityId===d.id).map(p=>({type:'Preparación offline',id:p.key,title:'Revisión '+p.revision})),...resourceRefs(d).map(id=>({type:'Recurso utilizado',id,title:id}))];}
export async function deleteDraft(id){
 const d=await getDraft(id);if(!d)throw new Error('Borrador no encontrado.');const deps=await dependenciesFor(d);if(deps.some(x=>x.type!=='Recurso utilizado'&&x.type!=='Preparación offline'))throw new Error('Hay dependencias. Archiva el borrador o revisa las lecciones y actividades vinculadas.');
 const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(['monitorContentDrafts','monitorContentVersions','monitorActivities','storageMetadata'],'readwrite');let done=0,blocked=false;const checked=()=>{if(++done<3)return;if(blocked){tx.abort();return;}tx.objectStore('monitorContentDrafts').delete(id);const versions=tx.objectStore('monitorContentVersions').getAll();versions.onsuccess=()=>versions.result.filter(v=>v.entityId===id&&v.owner===monitor.id).forEach(v=>tx.objectStore('monitorContentVersions').delete(v.id));const meta=tx.objectStore('storageMetadata').getAll();meta.onsuccess=()=>meta.result.filter(m=>m.entityId===id).forEach(m=>tx.objectStore('storageMetadata').delete(m.key));};const all=tx.objectStore('monitorContentDrafts').getAll();all.onsuccess=()=>{blocked=all.result.some(x=>x.id!==id&&(x.unitId===id||x.lessonIds?.includes(id)))||all.result.find(x=>x.id===id)?.revision!==d.revision;checked();};const acts=tx.objectStore('monitorActivities').getAll();acts.onsuccess=()=>{blocked=blocked||acts.result.some(a=>a.contentDraftId===id||a.resourceIds?.includes('lesson:'+id));checked();};checked();tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(new Error('El contenido cambió o tiene dependencias; recarga antes de eliminar.'));};});
}
export async function reorderDraft(id,direction){
 const rows=(await listDrafts()).filter(d=>d.state!=='archived'),d=rows.find(d=>d.id===id);if(!d)throw new Error('Borrador no encontrado.');
 const siblings=rows.filter(x=>x.kind===d.kind&&x.courseId===d.courseId&&x.grade===d.grade&&(d.kind==='unit'||x.unitId===d.unitId)).sort((a,b)=>a.order-b.order),i=siblings.findIndex(x=>x.id===id),other=siblings[i+direction];if(!other)return;
 const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(['monitorContentDrafts','monitorContentVersions'],'readwrite'),store=tx.objectStore('monitorContentDrafts');let loaded=0;for(const row of [d,other]){const req=store.get(row.id);req.onsuccess=()=>{if(req.result?.revision!==row.revision){tx.abort();return;}if(++loaded!==2)return;for(const [a,b] of [[d,other],[other,d]]){const next={...a,order:b.order,state:'draft',validation:null,revision:a.revision+1,version:a.version+1,updatedAt:new Date().toISOString()};store.put(next);tx.objectStore('monitorContentVersions').add({id:next.id+':'+next.revision,entityId:next.id,owner:monitor.id,version:next.version,state:next.state,createdAt:next.updatedAt,snapshot:next});}};}tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(new Error('El orden cambió en otra pestaña. Recarga.'));};});
}
