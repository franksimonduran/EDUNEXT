const DB_NAME = 'aithron-evaluations-demo';
const STORE = 'attempts';

function openDb(){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB === 'undefined'){ reject(new Error('noidb')); return; }
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = ()=>{
   const db = req.result;
   if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
  };
  req.onsuccess = ()=>resolve(req.result);
  req.onerror = ()=>reject(req.error);
 });
}

export async function saveDraft(attempt){
 const db = await openDb();
 return new Promise((resolve,reject)=>{
  const tx = db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(attempt);
  tx.oncomplete = ()=>resolve(true);
  tx.onerror = ()=>reject(tx.error);
 });
}

export async function loadDraft(id){
 const db = await openDb();
 return new Promise((resolve,reject)=>{
  const tx = db.transaction(STORE,'readonly');
  const req = tx.objectStore(STORE).get(id);
  req.onsuccess = ()=>resolve(req.result || null);
  req.onerror = ()=>reject(req.error);
 });
}

export async function deleteDraft(id){
 const db = await openDb();
 return new Promise((resolve,reject)=>{
  const tx = db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).delete(id);
  tx.oncomplete = ()=>resolve(true);
  tx.onerror = ()=>reject(tx.error);
 });
}
