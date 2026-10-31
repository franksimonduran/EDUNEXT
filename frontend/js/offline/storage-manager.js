import { getAll, put, del } from './database.js';

export async function listPackages(){ return getAll('contentPackages'); }
export async function savePackage(pkg){ return put('contentPackages', pkg); }
export async function removePackage(id){ return del('contentPackages', id); }
export async function listSync(){ return getAll('syncQueue'); }
export async function enqueue(op){ return put('syncQueue', op); }
export async function dequeue(opId){ return del('syncQueue', opId); }
export async function estimateStorage(){
 if(!navigator.storage||!navigator.storage.estimate) return null;
 try { return await navigator.storage.estimate(); } catch{return null; }
}
export async function isPersisted(){
 if(!navigator.storage||!navigator.storage.persisted) return null;
 try { return await navigator.storage.persisted(); } catch{return null; }
}
export async function requestPersist(){
 if(!navigator.storage||!navigator.storage.persist) return null;
 try { return await navigator.storage.persist(); } catch{return null; }
}
export { getAll, put, del };
