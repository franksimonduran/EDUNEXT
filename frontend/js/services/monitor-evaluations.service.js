import {openAithronDb,getAll,get} from '../offline/database.js';
import {demoEvaluations,demoAttempts,demoAttemptsFor,sampleQuestions} from '../data/monitor-evaluations-demo.data.js';
import {monitor} from '../data/monitor-demo.data.js';
import {evaluationErrors,assignmentErrors} from '../utils/monitor-evaluation-validation.js';
import {authorizedRooms,getStudent} from './monitor-students.service.js';
import {resultFor} from '../utils/monitor-grading.js';
export const uid=prefix=>prefix+'-'+crypto.randomUUID();
export const totalPoints=e=>e.questions.reduce((n,q)=>n+q.points,0);
export async function initEvaluations(){const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(['monitorEvaluations','monitorAttempts','storageMetadata'],'readwrite');const meta=tx.objectStore('storageMetadata');const req=meta.get('monitor-demo-seed-v1');req.onsuccess=()=>{if(!req.result){const items=demoEvaluations();items.forEach(e=>tx.objectStore('monitorEvaluations').add(e));demoAttempts(items).forEach(a=>tx.objectStore('monitorAttempts').add(a));meta.put({key:'monitor-demo-seed-v1',initializedAt:new Date().toISOString()});}};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
export async function listEvaluations(){return (await getAll('monitorEvaluations')).filter(e=>e.owner===monitor.id);}
export async function getEvaluation(id){const e=await get('monitorEvaluations',id);return e?.owner===monitor.id?e:null;}
export async function listAttempts(id){return (await getAll('monitorAttempts')).filter(a=>a.owner===monitor.id&&(!id||a.evaluationId===id)&&getStudent(a.studentId)?.classroomId===a.classroomId);}
export async function getAttempt(id){return (await listAttempts()).find(a=>a.id===id)||null;}
// Each local mutation and its future-sync event commit together, never as a confirmed send.
async function mutate(store,record,event,expectedRevision=null){const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction([store,'syncQueue'],'readwrite');const target=tx.objectStore(store);let conflict=false;const req=target.get(record.id);req.onsuccess=()=>{if(expectedRevision!==null&&(req.result?.revision??0)!==expectedRevision){conflict=true;tx.abort();return;}target.put(record);const opId=uid('op');tx.objectStore('syncQueue').put({opId,type:event,entityId:record.id,owner:monitor.id,installationScope:'demo-monitor',payload:{id:record.id,revision:record.revision},localVersion:record.version||1,createdAt:Date.now(),status:'pendiente',attempts:0,lastError:null,idempotencyKey:opId,requiresAuthorization:true});};tx.oncomplete=()=>{db.close();resolve(record);};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(conflict?'Este registro cambió en otra pestaña. Recarga antes de guardar.':'No se pudo guardar. Revisa el espacio disponible y vuelve a intentarlo.'));};});}
export async function saveEvaluation(e){
 if(typeof e.id!=='string'||!/^[a-zA-Z0-9-]{1,140}$/.test(e.id))throw new Error('El identificador del borrador no es válido.');
 const previous=await getEvaluation(e.id);
 if(previous&&e.revision!==previous.revision)throw new Error('Este borrador cambió en otra pestaña. Recarga antes de guardar.');
 if(previous&&(await listAttempts(e.id)).length)throw new Error('Hay intentos asociados. Duplica como nuevo borrador para editar sin alterar respuestas.');
 const errors=evaluationErrors(e).errors;if(errors.length)throw new Error(errors[0].message);
 if(previous?.state==='archived')throw new Error('Duplica el archivo para continuar en un nuevo borrador.');
 const changedScope=previous&&(previous.grade!==e.grade||previous.course!==e.course||previous.unitId!==e.unitId);
 const next={...structuredClone(e),owner:monitor.id,version:previous?.version||1,revision:(previous?.revision||0)+1,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
 if(changedScope){next.assignment=null;next.state='draft';next.questions=next.questions.map(q=>({...q,context:next.course}));}
 return mutate('monitorEvaluations',next,'monitor.evaluation.draft',previous?.revision??null);
}
export async function duplicateEvaluation(id){const e=await getEvaluation(id);if(!e)throw new Error('Evaluación no encontrada');return saveEvaluation({...e,id:uid('evaluation'),title:(e.title.slice(0,140)+' — Copia'),revision:0,version:1,state:'draft',assignment:null,questions:e.questions.map(q=>({...structuredClone(q),id:uid('question')}))});}
export async function archiveEvaluation(id){const e=await getEvaluation(id);if(!e)throw new Error('Evaluación no encontrada');return mutate('monitorEvaluations',{...e,state:'archived',revision:e.revision+1,updatedAt:new Date().toISOString()},'monitor.evaluation.archive',e.revision);}
export async function deleteEvaluation(id){const e=await getEvaluation(id);if(!e||e.state!=='draft'||(await listAttempts(id)).length)throw new Error('Solo se pueden eliminar borradores sin intentos.');const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(['monitorEvaluations','syncQueue'],'readwrite');tx.objectStore('monitorEvaluations').delete(id);const opId=uid('op');tx.objectStore('syncQueue').put({opId,type:'monitor.evaluation.delete',entityId:id,owner:monitor.id,payload:{id},status:'pendiente',attempts:0,createdAt:Date.now(),idempotencyKey:opId,requiresAuthorization:true});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
export async function saveAssignment(e,a){const errors=assignmentErrors(e,a,authorizedRooms());if(errors.length)throw new Error(errors.join('\n'));return saveEvaluation({...e,state:'scheduled',assignment:{...a,id:'assignment-'+e.id,version:e.version,state:'local'},duration:a.duration,maxAttempts:a.maxAttempts});}
export async function saveReview(attempt,reviews){const original=await getAttempt(attempt.id);if(!original)throw new Error('Intento no encontrado');if((attempt.revision||0)!==(original.revision||0))throw new Error('La revisión cambió en otra pestaña. Recarga antes de guardar.');for(const q of original.snapshot.questions){const r=reviews[q.id];if(r&&((q.type==='open'&&r.score!==null&&(!Number.isFinite(r.score)||r.score<0||r.score>q.points))||typeof r.comment!=='string'||r.comment.length>2000))throw new Error('Revisa los puntajes (entre 0 y el máximo) y comentarios de hasta 2000 caracteres.');}const next={...original,reviews:structuredClone(reviews),revision:(original.revision||0)+1,updatedAt:new Date().toISOString()};next.state=resultFor(next).complete?'reviewed-demo':'review-pending';return mutate('monitorAttempts',next,'monitor.attempt.review',original.revision??null);}
export const apiCapability=()=>({available:false,reason:'Requiere FastAPI, identidad y autorización; no se realizan solicitudes.'});
// Explicit fixture action, not a delivery: reuse only the untouched example drafts and the same attempt store.
export async function addAcademicDemoAttempts(){
 const evaluations=await listEvaluations(),existing=await listAttempts();
 const untouched=e=>e?.owner===monitor.id&&/^teacher-demo-[456]-[1-4]$/.test(e.id)&&e.revision===1&&e.state==='draft'&&JSON.stringify(e.questions)===JSON.stringify(sampleQuestions(e.course));
 const candidates=evaluations.filter(e=>untouched(e)&&!existing.some(a=>a.evaluationId===e.id));
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['monitorEvaluations','monitorAttempts'],'readwrite');let added=0;
  for(const candidate of candidates){
   const req=tx.objectStore('monitorEvaluations').get(candidate.id);
   req.onsuccess=()=>{const current=req.result;if(!untouched(current))return;const examples=demoAttemptsFor(current),check=tx.objectStore('monitorAttempts').get(examples[0].id);check.onsuccess=()=>{if(check.result)return;for(const attempt of examples){tx.objectStore('monitorAttempts').add(attempt);added++;}};};
  }
  tx.oncomplete=()=>{db.close();resolve(added);};
  tx.onerror=tx.onabort=()=>{db.close();reject(new Error('No se pudieron guardar los ejemplos. No se reemplazaron correcciones existentes.'));};
 });
}
