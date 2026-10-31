import {openAithronDb} from '../offline/database.js';

const store='adminContentReviews';

export async function saveContentReview(review){
  const db=await openAithronDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    const s=tx.objectStore(store);
    const record={...review,id:review.id||('review-'+review.proposalId+':'+review.version),updatedAt:new Date().toISOString()};
    s.put(record);
    tx.oncomplete=()=>{db.close();resolve(record);};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}

export async function listContentReviews(){
  try{
    const db=await openAithronDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readonly');
      const s=tx.objectStore(store);
      const req=s.getAll();
      req.onsuccess=()=>{db.close();resolve(req.result||[]);};
      req.onerror=()=>{db.close();reject(req.error);};
    });
  }catch{throw new Error('No se pudieron consultar las revisiones locales.');}
}

export async function getContentReview(id){
  const all=await listContentReviews();
  return all.find(r=>r.id===id)||null;
}

export async function savePublicationPrep(prep){
  try{
    const db=await openAithronDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('adminPublicationPrep','readwrite');
      const s=tx.objectStore('adminPublicationPrep');
      const record={...prep,id:prep.id||('prep-'+crypto.randomUUID()),updatedAt:new Date().toISOString()};
      s.put(record);
      tx.oncomplete=()=>{db.close();resolve(record);};
      tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }catch{throw new Error('No se pudo guardar la preparación local.');}
}

export async function listPublicationPrep(){
  try{
    const db=await openAithronDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('adminPublicationPrep','readonly');
      const s=tx.objectStore('adminPublicationPrep');
      const req=s.getAll();
      req.onsuccess=()=>{db.close();resolve(req.result||[]);};
      req.onerror=()=>{db.close();reject(req.error);};
    });
  }catch{return [];}
}
