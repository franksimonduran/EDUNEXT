import { openAithronDb } from '../offline/database-schema.js';
import { listPackages } from '../offline/package-manager.js';
import { listPending } from '../offline/sync-queue.js';
import { getAll } from '../offline/database.js';

export async function getStorageSummary(){
  const estimate=('storage' in navigator && 'estimate' in navigator.storage)
    ? await navigator.storage.estimate()
    : {usage:0,quota:0};
  
  const db=await openAithronDb();
  const storeNames=[...db.objectStoreNames];
  db.close();
  
  const packages=await listPackages();
  const pendingOps=await listPending();
  
  let draftsCount=0;
  try{
    const allDrafts=await getAll('monitorContentDrafts');
    draftsCount=allDrafts.filter(d=>d.state!=='archived').length;
  }catch{}
  
  let adminDraftsCount=0;
  try{
    const allAdmin=await getAll('adminAcademicRecords');
    adminDraftsCount=allAdmin.filter(r=>r.state!=='archived').length;
  }catch{}
  
  return {
    estimate:{
      usedBytes:estimate.usage||0,
      quotaBytes:estimate.quota||0,
      usedMB:((estimate.usage||0)/1024/1024).toFixed(2),
      quotaMB:((estimate.quota||0)/1024/1024).toFixed(2),
      percentUsed:estimate.quota?((estimate.usage/estimate.quota)*100).toFixed(1):'?',
    },
    database:{
      version:(await import('../offline/database-schema.js')).DB_VERSION,
      stores:storeNames.length,
      storesList:storeNames,
    },
    counts:{
      offlinePackages:packages.length,
      pendingSyncOps:pendingOps.length,
      monitorDrafts:draftsCount,
      adminDrafts:adminDraftsCount,
    },
    persistence:await getPersistenceStatus(),
    limitations:['Estimaciones del navegador','No incluye almacenamiento de otros orígenes','Cuota puede variar por política del navegador'],
  };
}

async function getPersistenceStatus(){
  if(!('storage' in navigator && 'persisted' in navigator.storage)) return {supported:false};
  const persisted=await navigator.storage.persisted();
  return {supported:true,persisted};
}

export async function getIndexedDBDetail(){
  const db=await openAithronDb();
  const storeNames=[...db.objectStoreNames];
  const details={};
  
  for(const name of storeNames){
    try{
      const count=await new Promise((resolve,reject)=>{const req=db.transaction(name).objectStore(name).count();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
      details[name]={count,sample:[]};
    }catch{
      details[name]={count:'error',sample:[]};
    }
  }
  db.close();
  return {stores:details};
}

export async function getStorageUsageByStore(){
  const db=await openAithronDb();
  const storeNames=[...db.objectStoreNames];
  const usage={};
  
  for(const name of storeNames){
    try{
      const all=await (await import('../offline/database.js')).getAll(name);
      let bytes=0;
      for(const item of all){
        bytes+=new TextEncoder().encode(JSON.stringify(item)).length;
      }
      usage[name]={count:all.length,approxBytes:bytes,approxKB:(bytes/1024).toFixed(1)};
    }catch{
      usage[name]={count:0,approxBytes:0,approxKB:'0'};
    }
  }
  db.close();
  return usage;
}

export async function getStorageMetadata(){
  try{
    const meta=await (await import('../offline/database.js')).getAll('storageMetadata');
    return meta.reduce((acc,m)=>{acc[m.key]=m.value;return acc;},{});
  }catch{return {};}
}

export async function clearStorageMetadata(key){
  try{
    await (await import('../offline/database.js')).del('storageMetadata',key);
    return {ok:true};
  }catch(e){return {ok:false,error:e.message};}
}

export function formatBytes(bytes){
  if(bytes<1024) return bytes+' B';
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB';
  if(bytes<1024*1024*1024) return (bytes/1024/1024).toFixed(2)+' MB';
  return (bytes/1024/1024/1024).toFixed(2)+' GB';
}
