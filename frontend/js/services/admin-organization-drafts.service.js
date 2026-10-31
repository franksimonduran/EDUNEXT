import {getAll,get,openAithronDb} from '../offline/database.js';
import {demoAdministrator,demoInstitution} from '../data/admin-demo.data.js';
const owner=demoAdministrator.id,store='adminAcademicRecords',versions='adminAcademicRecordVersions';
export const academicRecordTypes=Object.freeze(['classroom','section','period','enrollment','assignment','movement']);
export async function listAcademicRecords(type=null){const all=await getAll(store);return all.filter(r=>r.owner===owner&&r.institutionId===demoInstitution.id&&(!type||r.type===type)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));}
export async function getAcademicRecord(id){const r=await get(store,id);return r?.owner===owner&&r.institutionId===demoInstitution.id?r:null;}
export function newAcademicRecord(type,data={}){if(!academicRecordTypes.includes(type))throw new Error('Tipo de borrador no válido.');return {id:'admin-academic-'+crypto.randomUUID(),type,owner,institutionId:demoInstitution.id,state:'draft',revision:0,version:0,data:structuredClone(data),createdAt:null,updatedAt:null};}
export async function saveAcademicRecord(record,{allowIncomplete=false,ready=false,validator=null}={}){
 if(!record||!academicRecordTypes.includes(record.type)||!/^admin-academic-[a-z0-9-]+$/.test(record.id||''))throw new Error('Modelo de borrador no válido.');
 if(record.owner!==owner||record.institutionId!==demoInstitution.id)throw new Error('El borrador pertenece a otro ámbito o institución.');
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction([store,versions],'readwrite'),s=tx.objectStore(store);let next,message='No se pudo guardar el borrador local. Revisa el almacenamiento y vuelve a intentarlo.';
  const read=s.getAll();
  read.onsuccess=()=>{
   const all=read.result,old=all.find(x=>x.id===record.id);
   if((old&&(old.owner!==owner||old.institutionId!==demoInstitution.id||old.revision!==record.revision||old.state==='archived'||old.type!==record.type))||(!old&&record.revision)){message='Este borrador cambió, fue retirado o está archivado. Recarga antes de editar.';tx.abort();return;}
   const validation=validator?validator(record,all.filter(x=>x.owner===owner&&x.institutionId===demoInstitution.id)):null;
   const errors=validation?.errors||[];
   if(ready&&errors.length){message=errors.map(e=>e.message).join(' ')||'Revisa los datos antes de guardar.';tx.abort();return;}
   if(errors.length&&!allowIncomplete){message=errors.map(e=>e.message).join(' ')||'Revisa los datos antes de guardar.';tx.abort();return;}
    next={...structuredClone(record),state:errors.length?'incomplete':(ready||old?.state==='ready')?'ready':'draft',revision:(old?.revision||0)+1,version:(old?.version||0)+1,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),validation:validation||null};
   s.put(next);tx.objectStore(versions).add({id:next.id+':'+next.revision,entityId:next.id,owner,snapshot:structuredClone(next),createdAt:next.updatedAt});
  };
  tx.oncomplete=()=>{db.close();resolve(next);};
  tx.onabort=tx.onerror=()=>{db.close();reject(new Error(message));};
 });
}
export async function archiveAcademicRecord(record){const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction([store,versions],'readwrite'),s=tx.objectStore(store);let reason='No se pudo archivar el borrador local.';const read=s.getAll();read.onsuccess=()=>{const old=read.result.find(x=>x.id===record.id);if(!old||old.owner!==owner||old.institutionId!==demoInstitution.id||old.revision!==record.revision||old.state==='archived'){reason='El borrador cambió o ya está archivado.';tx.abort();return;}const next={...old,state:'archived',revision:old.revision+1,version:old.version+1,updatedAt:new Date().toISOString()};s.put(next);tx.objectStore(versions).add({id:next.id+':'+next.revision,entityId:next.id,owner,snapshot:structuredClone(next),createdAt:next.updatedAt});};tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(reason));};});}
export async function deleteAcademicRecord(record,{dependencies=[]}={}){if(dependencies.length)throw new Error('Hay propuestas dependientes ('+dependencies.length+'). Consérvalas o retíralas explícitamente antes de eliminar este borrador.');const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction([store,versions],'readwrite'),s=tx.objectStore(store);let reason='No se pudo eliminar el borrador local.';const read=s.getAll();read.onsuccess=()=>{const old=read.result.find(x=>x.id===record.id);if(!old||old.owner!==owner||old.institutionId!==demoInstitution.id||old.revision!==record.revision){reason='El registro cambió o no es un borrador propio.';tx.abort();return;}s.delete(record.id);const v=tx.objectStore(versions).getAll();v.onsuccess=()=>v.result.filter(x=>x.entityId===record.id&&x.owner===owner).forEach(x=>tx.objectStore(versions).delete(x.id));};tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(reason));};});}
export async function academicRecordVersions(id){return (await getAll(versions)).filter(v=>v.entityId===id&&v.owner===owner).sort((a,b)=>String(a.id).localeCompare(String(b.id)));}
