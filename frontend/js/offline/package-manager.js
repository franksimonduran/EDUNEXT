import { getAll, put, del } from './database.js';

export async function listPackages(){ return getAll('contentPackages'); }
export async function savePackage(p){ return put('contentPackages', {...p, updatedAt: Date.now()}); }
export async function removePackage(id){ return del('contentPackages', id); }
export async function getPackage(id){
 const db=await (await import('./database-schema.js')).openAithronDb();
 return new Promise((r,rej)=>{
  const t=db.transaction('contentPackages','readonly'); const req=t.objectStore('contentPackages').get(id);
  req.onsuccess=()=>r(req.result||null); req.onerror=()=>rej(req.error);
 });
}
export async function hasPackage(id){ const p=await getPackage(id); return !!p; }
export async function verifyPackage(id){ const p=await getPackage(id); return !!p?.verified; }
