import {openAithronDb} from '../offline/database.js';

const store='adminReportConfigs';
const historyStore='adminReportHistory';

export async function listReportConfigs(){
  try{
    const db=await openAithronDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readonly'),s=tx.objectStore(store),req=s.getAll();
      req.onsuccess=()=>{db.close();resolve(req.result||[]);};
      req.onerror=()=>{db.close();reject(req.error);};
    });
  }catch{throw new Error('No se pudieron leer las configuraciones locales.');}
}

export async function saveReportConfig(config){
  const db=await openAithronDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite'),s=tx.objectStore(store);
    const record={...config,id:config.id||('cfg-'+crypto.randomUUID()),updatedAt:new Date().toISOString()};
    s.put(record);
    tx.oncomplete=()=>{db.close();resolve(record);};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}

export async function deleteReportConfig(id){
  const db=await openAithronDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite'),s=tx.objectStore(store);
    s.delete(id);
    tx.oncomplete=()=>{db.close();resolve(true);};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}

export async function listReportHistory(){
  try{
    const db=await openAithronDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(historyStore,'readonly'),s=tx.objectStore(historyStore),req=s.getAll();
      req.onsuccess=()=>{db.close();resolve(req.result||[]);};
      req.onerror=()=>{db.close();reject(req.error);};
    });
  }catch{return [];}
}

export async function saveReportHistory(entry){
  const db=await openAithronDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(historyStore,'readwrite'),s=tx.objectStore(historyStore);
    const record={...entry,id:entry.id||('hist-'+crypto.randomUUID()),createdAt:new Date().toISOString()};
    s.put(record);
    tx.oncomplete=()=>{db.close();resolve(record);};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}

export async function deleteReportHistory(id){
  const db=await openAithronDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(historyStore,'readwrite'),s=tx.objectStore(historyStore);
    s.delete(id);
    tx.oncomplete=()=>{db.close();resolve(true);};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
