import {openAithronDb} from '../offline/database-schema.js';
import {demoInstitution} from '../data/admin-demo.data.js';
const store='adminConfigurationProposals',versions='adminConfigurationVersions';
export const configurationBase=()=>({institutionId:demoInstitution.id,name:demoInstitution.name,shortName:'',description:'',locale:'es',timeZone:'America/Lima',color:'#3b5bdb',period:'all',presentation:'normal'});
const allowed=['name','shortName','description','locale','timeZone','color','period','presentation'];
export function validateConfiguration(data){
 const errors=[];
 if(!data||typeof data!=='object')return {errors:['Propuesta no válida.'],warnings:[]};
 if(Object.keys(data).some(k=>!allowed.includes(k)))errors.push('Campo no permitido.');
 if(typeof data.name!=='string'||!data.name.trim()||data.name.length>100)errors.push('Nombre obligatorio, máximo 100 caracteres.');
 for(const k of ['name','shortName','description'])if(typeof data[k]!=='string'||data[k].length>(k==='description'?400:100)||/[<>]|javascript:/i.test(data[k]))errors.push('Texto no válido: '+k);
 if(!['es','en'].includes(data.locale))errors.push('Idioma no soportado.');
 try{new Intl.DateTimeFormat('es',{timeZone:data.timeZone}).format();}catch{errors.push('Zona horaria no válida.');}
 if(!['#3b5bdb','#7145bf','#18469e'].includes(data.color))errors.push('Color no permitido.');
 if(!['all',...demoInstitution.periods.map(p=>p.id)].includes(data.period))errors.push('Periodo no disponible.');
 if(!['normal','compact'].includes(data.presentation))errors.push('Presentación no válida.');
 return {errors:[...new Set(errors)],warnings:['Propuesta local sin aplicación institucional. El análisis de impacto es parcial; idioma, periodo e identidad visual requieren revisión institucional.']};
}
export async function listConfigurationProposals(){const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store),req=tx.objectStore(store).getAll();req.onsuccess=()=>resolve(req.result.filter(r=>r.owner==='demo-admin'&&r.institutionId===demoInstitution.id));tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(new Error('No se pudieron leer las propuestas.'));};});}
export async function saveConfigurationProposal(input){
 const data=structuredClone(input.data),validation=validateConfiguration(data);
 if(!['institution','academic','platform','branding'].includes(input.type))throw new Error('Tipo de propuesta no válido.');
 const db=await openAithronDb();
 return new Promise((resolve,reject)=>{const tx=db.transaction([store,versions],'readwrite'),s=tx.objectStore(store);let record,reason='No se pudo guardar la propuesta.';const id=input.id||'admin-config-'+crypto.randomUUID();const req=s.get(id);
 req.onsuccess=()=>{const old=req.result;if(old&&(old.owner!=='demo-admin'||old.institutionId!==demoInstitution.id||old.revision!==input.revision||old.state==='archived')){reason='La propuesta cambió o está archivada. Recarga antes de guardar.';tx.abort();return;}
 const now=new Date().toISOString();record={id,type:old?.type||input.type,owner:'demo-admin',institutionId:demoInstitution.id,base:old?.base||configurationBase(),data,revision:(old?.revision||0)+1,createdAt:old?.createdAt||now,updatedAt:now,state:validation.errors.length?'errors':input.ready?'ready':'draft',validation};s.put(record);tx.objectStore(versions).put({id:id+':'+record.revision,proposalId:id,snapshot:record});};
 tx.oncomplete=()=>{db.close();resolve(record);};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(reason));};});
}
export async function retireConfigurationProposal(record,remove=false){const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),s=tx.objectStore(store),req=s.get(record.id);req.onsuccess=()=>{const old=req.result;if(!old||old.owner!=='demo-admin'||old.institutionId!==demoInstitution.id||old.revision!==record.revision){tx.abort();return;}if(remove)s.delete(old.id);else s.put({...old,state:'archived',revision:old.revision+1,updatedAt:new Date().toISOString()});};tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(new Error('La propuesta cambió; recarga la lista.'));};});}
