// Opt-in client for new authenticated operations only; never imports demo queue data.
import {openAithronDb,getAll} from './database.js';
import {syncBootstrap,pushSyncOperations} from '../services/sync-api.service.js';
import {requireContext,operationBody,ownedOperations,validateReceipt,retryDelay,failureState,nextRetryAt} from '../sync/protocol.js';

async function transaction(stores,write){
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(stores,'readwrite');
  tx.oncomplete=()=>{db.close();resolve();};
  tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||new Error('Guardado local interrumpido.'));};
  try{write(tx);}catch(error){tx.abort();db.close();reject(error);}
 });
}
export async function queueLessonCompletion(context,lessonId,versionId){
 const accountScope=requireContext(context),id=crypto.randomUUID();
 const operation={opId:id,protocolVersion:1,accountScope,status:'ready',attempts:0,nextAttemptAt:0,
  createdAt:Date.now(),body:{client_operation_id:id,operation_type:'lesson.progress.complete',
   schema_version:1,resource_id:lessonId,lesson_version_id:versionId}};
 operationBody(operation);
 await transaction(['syncQueue','learningProgress'],tx=>{
  tx.objectStore('syncQueue').add(operation);
  tx.objectStore('learningProgress').put({id:`sync-v1:${accountScope}:${lessonId}`,
   accountScope,lessonId,versionId,status:'local_provisional',operationId:id});
 });
 return operation;
}
async function saveState(operation,status,extra={}){
 await transaction(['syncQueue'],tx=>tx.objectStore('syncQueue').put({...operation,...extra,status}));
}
async function confirm(operation,receipt){
 validateReceipt(operation,receipt);
 await transaction(['syncQueue','syncReceipts','learningProgress'],tx=>{
  tx.objectStore('syncReceipts').put({id:`${operation.accountScope}:${operation.opId}`,accountScope:operation.accountScope,...receipt});
  tx.objectStore('syncQueue').put({...operation,status:'confirmed',lastError:null});
  const store=tx.objectStore('learningProgress'),key=`sync-v1:${operation.accountScope}:${operation.body.resource_id}`;
  const request=store.get(key);
  request.onsuccess=()=>{
   // A newer provisional operation must not be overwritten by an older receipt.
   if(request.result?.operationId===operation.opId)store.put({...request.result,status:'server_confirmed',confirmedAt:receipt.confirmed_at});
  };
 });
}
export async function syncAuthenticatedProgress(){
 if(!navigator.locks?.request)throw new Error('Este navegador requiere coordinación de pestañas compatible; no se enviaron datos.');
 const context=await syncBootstrap(),scope=requireContext(context);
 return navigator.locks.request(`aithron-sync-v1:${scope}`,async()=>{
  const queue=ownedOperations(await getAll('syncQueue'),context)
   .filter(o=>['ready','sending','retryable_error','blocked_auth'].includes(o.status)&&o.attempts<5&&o.nextAttemptAt<=Date.now())
   .sort((a,b)=>a.createdAt-b.createdAt||a.opId.localeCompare(b.opId)).slice(0,25);
  let confirmed=0;
  for(const operation of queue){
   operationBody(operation);
   const attempt={...operation,attempts:operation.attempts+1};
   await saveState(attempt,'sending');
   try{
    const result=await pushSyncOperations(context,[attempt.body]);
    if(!Array.isArray(result)||result.length!==1)throw new Error('Respuesta de sincronización inválida.');
    const receipt=result[0];
    if(receipt.client_operation_id!==operation.opId)throw new Error('Recibo ajeno a la operación.');
    if(['applied','already_applied'].includes(receipt.status)){
     await confirm(attempt,receipt);confirmed++;
    }else{
     const state={conflict:'conflict',rejected:'rejected',retryable:'retryable_error'}[receipt.status];
     if(!state)throw new Error('Estado de servidor desconocido.');
     await saveState(attempt,state,{lastError:'SYNC_OPERATION_NOT_APPLIED',nextAttemptAt:Date.now()+retryDelay(attempt.attempts)});
    }
   }catch(error){
    const state=failureState(error.status);
    await saveState(attempt,state,{lastError:state==='blocked_auth'?'AUTH_REQUIRED':'SYNC_NOT_CONFIRMED',nextAttemptAt:nextRetryAt(attempt.attempts,error.retryAfter)});
    // Session/network failure stops this run; never try the next user's work.
    break;
   }
  }
  return {confirmed,considered:queue.length,accountScope:scope};
 });
}
