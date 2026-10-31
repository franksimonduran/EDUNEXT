import {openAithronDb,getAll,get} from '../offline/database.js';
import {monitor} from '../data/monitor-demo.data.js';
import {supportExamples} from '../data/monitor-support-demo.data.js';
import {activityValidation,assignmentValidation,assignmentRecipients,observationError} from '../utils/learning-support-validation.js';
import {getStudent} from './monitor-students.service.js';
import {resourceById} from './monitor-learning-resources.service.js';
export const supportId=prefix=>prefix+'-'+crypto.randomUUID();
export async function initSupport(){
 const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(['monitorActivities','monitorActivityAssignments','monitorActivityRecords','storageMetadata'],'readwrite');const metadata=tx.objectStore('storageMetadata'),req=metadata.get('monitor-support-demo-v1');req.onsuccess=()=>{if(req.result)return;const data=supportExamples();for(const [key,store] of [['activities','monitorActivities'],['assignments','monitorActivityAssignments'],['records','monitorActivityRecords']])data[key].forEach(row=>tx.objectStore(store).add(row));metadata.put({key:'monitor-support-demo-v1',createdAt:new Date().toISOString()});};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(new Error('No se pudo abrir la demostración de actividades.'));};});
}
export async function listActivities(){return (await getAll('monitorActivities')).filter(a=>a.owner===monitor.id);}
export async function getActivity(id){const a=await get('monitorActivities',id);return a?.owner===monitor.id?a:null;}
export async function listAssignments(){return (await getAll('monitorActivityAssignments')).filter(a=>a.owner===monitor.id);}
export async function assignmentFor(id){return (await listAssignments()).find(a=>a.activityId===id)||null;}
export async function listRecords(activityId){return (await getAll('monitorActivityRecords')).filter(r=>r.owner===monitor.id&&(!activityId||r.activityId===activityId)&&getStudent(r.studentId));}
export async function observationsFor(id){return (await getAll('monitorActivityObservations')).filter(o=>o.owner===monitor.id&&o.activityId===id);}
async function commit(store,value,event,expected,extra=[],guards=[]){
 const db=await openAithronDb();return new Promise((resolve,reject)=>{const names=[...new Set([store,'syncQueue',...extra.map(x=>x.store),...guards.map(x=>x.store)])],tx=db.transaction(names,'readwrite');let conflict=false;const target=tx.objectStore(store),req=target.get(value.id);
 const write=()=>{target.put(value);for(const item of extra)tx.objectStore(item.store).delete(item.id);const opId=supportId('op');tx.objectStore('syncQueue').put({opId,type:event,entityId:value.id,owner:monitor.id,installationScope:'demo-monitor',localVersion:value.version||value.activityVersion||1,payload:{id:value.id,revision:value.revision},status:'pendiente',attempts:0,lastError:null,createdAt:Date.now(),idempotencyKey:opId,requiresAuthorization:true});};
 req.onsuccess=()=>{if(expected!==null&&(req.result?.revision??0)!==expected){conflict=true;tx.abort();return;}let remaining=guards.length;if(!remaining){write();return;}for(const guard of guards){const check=tx.objectStore(guard.store).get(guard.id);check.onsuccess=()=>{if(check.result?.revision!==guard.revision){conflict=true;tx.abort();return;}if(--remaining===0)write();};}};
 tx.oncomplete=()=>{db.close();resolve(value);};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(conflict?'Este registro cambió en otra pestaña. Recarga antes de guardar.':'No se pudo guardar en este navegador. Revisa el espacio disponible y reintenta.'));};});
}
export async function saveActivity(a){
 if(!/^[a-zA-Z0-9-]{1,150}$/.test(a.id||''))throw new Error('Identificador de actividad no válido.');
 const old=await getActivity(a.id);if(old&&(old.revision!==a.revision||old.state==='archived'))throw new Error('El borrador cambió o está archivado. Recarga o duplica para editar.');
 if((await listRecords(a.id)).length)throw new Error('Hay registros asociados. Duplica la actividad para modificar su contenido sin alterar el seguimiento.');
 const validation=activityValidation(a);if(validation.errors.length)throw new Error(validation.errors.join(' '));
 const next={...structuredClone(a),resourceVersions:Object.fromEntries(a.resourceIds.map(id=>[id,resourceById(id,a.grade).version])),owner:monitor.id,state:'draft',version:old?old.version+1:1,revision:(old?.revision||0)+1,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
 return commit('monitorActivities',next,'monitor.activity.draft',old?.revision??null,[{store:'monitorActivityAssignments',id:'assignment-'+a.id}]);
}
export async function duplicateActivity(id){const a=await getActivity(id);if(!a)throw new Error('Actividad no encontrada.');return saveActivity({...a,id:supportId('activity'),title:a.title.slice(0,140)+' — Copia',version:1,revision:0,state:'draft',steps:a.steps.map(s=>({...s,id:supportId('step')}))});}
export async function archiveActivity(id){const a=await getActivity(id);if(!a)throw new Error('Actividad no encontrada.');return commit('monitorActivities',{...a,state:'archived',revision:a.revision+1,updatedAt:new Date().toISOString()},'monitor.activity.archive',a.revision);}
export async function deleteActivity(id){
 const a=await getActivity(id);if(!a||a.state!=='draft'||await assignmentFor(id)||(await listRecords(id)).length||(await observationsFor(id)).length)throw new Error('Solo puedes eliminar un borrador sin destinatarios, registros ni observaciones. Puedes archivarlo para conservar sus referencias.');
 const db=await openAithronDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['monitorActivities','monitorActivityAssignments','monitorActivityRecords','monitorActivityObservations','syncQueue'],'readwrite');let remaining=4,blocked=false;
  function checked(valid){if(!valid){blocked=true;tx.abort();return;}if(--remaining)return;tx.objectStore('monitorActivities').delete(id);const opId=supportId('op');tx.objectStore('syncQueue').put({opId,type:'monitor.activity.delete',entityId:id,owner:monitor.id,payload:{id},status:'pendiente',attempts:0,createdAt:Date.now(),idempotencyKey:opId,requiresAuthorization:true});}
  const current=tx.objectStore('monitorActivities').get(id);current.onsuccess=()=>checked(current.result?.revision===a.revision&&current.result?.state==='draft');
  const assignment=tx.objectStore('monitorActivityAssignments').get('assignment-'+id);assignment.onsuccess=()=>checked(!assignment.result);
  for(const store of ['monitorActivityRecords','monitorActivityObservations']){const rows=tx.objectStore(store).getAll();rows.onsuccess=()=>checked(!rows.result.some(r=>r.activityId===id));}
  tx.oncomplete=()=>{db.close();resolve();};tx.onerror=tx.onabort=()=>{db.close();reject(new Error(blocked?'El borrador cambió o tiene registros relacionados. Recarga; puedes archivarlo para conservarlos.':'No se pudo eliminar el borrador.'));};
 });
}
export async function saveActivityAssignment(activity,config){
 const current=await getActivity(activity.id);if(!current||current.revision!==activity.revision||current.state==='archived')throw new Error('La actividad cambió. Recarga su versión antes de configurar destinatarios.');
 if((await listRecords(activity.id)).length)throw new Error('Hay registros de seguimiento: duplica la actividad para configurar otros destinatarios.');
 const errors=assignmentValidation(current,config);if(errors.length)throw new Error(errors.join(' '));
 const old=await assignmentFor(activity.id);if(old&&(config.revision||0)!==old.revision)throw new Error('La configuración cambió en otra pestaña. Recarga.');
 const next={...structuredClone(config),rooms:config.mode==='group'?config.rooms:[],studentIds:config.mode==='individual'?config.studentIds:[],groups:config.mode==='differentiated'?config.groups:[],id:'assignment-'+activity.id,activityId:activity.id,activityVersion:current.version,owner:monitor.id,revision:(old?.revision||0)+1,state:'local',createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};return commit('monitorActivityAssignments',next,'monitor.activity.assignment',old?.revision??null,[],[{store:'monitorActivities',id:current.id,revision:current.revision}]);
}
export async function saveObservation(activityId,text,studentId='',expected=null){
 const activity=await getActivity(activityId);if(!activity)throw new Error('Actividad no encontrada.');const error=observationError(text);if(error)throw new Error(error);
 const assignment=await assignmentFor(activityId);if(studentId&&(!assignment||!assignmentRecipients(activity,assignment).includes(studentId)))throw new Error('El estudiante no está entre los destinatarios de esta actividad.');
 const id=`observation-${activityId}-${studentId||'general'}`,old=await get('monitorActivityObservations',id);if(old&&expected!==old.revision)throw new Error('La observación cambió en otra pestaña. Recarga.');
 return commit('monitorActivityObservations',{id,activityId,studentId,text:text.trim(),owner:monitor.id,author:monitor.alias,state:'demo-local',revision:(old?.revision||0)+1,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()},'monitor.activity.observation',old?.revision??null);
}
export function activityState(activity,assignment,records){if(activity.state==='archived')return 'archived';if(records.length){const recipients=assignment?assignmentRecipients(activity,assignment):[];return recipients.length&&recipients.every(id=>records.some(r=>r.studentId===id&&['finished-local','reviewed-demo'].includes(r.state)))?'finished':'tracking';}return assignment?'scheduled':'draft';}
