import { getAll, put, del } from './database.js';
import { isOnline } from '../utils/storage-format.js';

function uuid(){ return 'op-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8); }
export async function enqueue(type, payload){
 const op={opId: uuid(), type, payload, status:'pendiente', attempts:0, createdAt: Date.now(), lastError:null, idempotencyKey: uuid()};
 await put('syncQueue', op);
 return op;
}
export async function listPending(){ const all=await getAll('syncQueue'); return all.filter(o=>o.status==='pendiente'||o.status==='error-temporal'); }
export async function markStatus(opId, status, extra={}){
 const db=await (await import('./database-schema.js')).openAithronDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction('syncQueue','readwrite'); const s=t.objectStore('syncQueue'); const req=s.get(opId);
  req.onsuccess=()=>{
   const o=req.result||{opId};
   o.status=status; Object.assign(o,extra);
   s.put(o);
   t.oncomplete=()=>resolve(o); t.onerror=()=>reject(t.error);
  }; req.onerror=()=>reject(req.error);
 });
}
export async function canSync(){ return isOnline(); }
export async function syncNow(){
 if(!canSync()) throw new Error('offline');
 // No real backend; do not send. Just report status.
 return {ok:false, reason:'no-backend'};
}
export { getAll };
