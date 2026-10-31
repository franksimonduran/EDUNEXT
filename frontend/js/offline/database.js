import { openAithronDb } from './database-schema.js';

async function tx(store, mode='readonly'){
 const db=await openAithronDb();
 return {db, tx:db.transaction(store,mode), store: db.transaction(store,mode).objectStore(store)};
}
export async function getAll(store){
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction(store,'readonly'); const s=t.objectStore(store); const req=s.getAll();
   req.onsuccess=()=>resolve(req.result||[]);
   req.onerror=()=>reject(req.error);
   t.oncomplete=()=>db.close();t.onabort=()=>{db.close();reject(t.error);};
 });
}
export async function get(store,key){
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction(store,'readonly'); const s=t.objectStore(store); const req=s.get(key);
   req.onsuccess=()=>resolve(req.result||null);
   req.onerror=()=>reject(req.error);
   t.oncomplete=()=>db.close();t.onabort=()=>{db.close();reject(t.error);};
 });
}
export async function put(store,val){
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction(store,'readwrite'); t.objectStore(store).put(val);
   t.oncomplete=()=>{db.close();resolve(true);};
   t.onerror=t.onabort=()=>{db.close();reject(t.error);};
 });
}
export async function del(store,key){
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction(store,'readwrite'); t.objectStore(store).delete(key);
   t.oncomplete=()=>{db.close();resolve(true);};
   t.onerror=t.onabort=()=>{db.close();reject(t.error);};
 });
}
export async function count(store){
 const all=await getAll(store); return all.length;
}
export { openAithronDb };
