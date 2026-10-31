import { getAll, put, del } from '../offline/database.js';

const ACTIVITY_STORE='technicalActivity';
const MAX_ACTIVITY=500;

async function ensureStore(){
  const db=await (await import('../offline/database-schema.js')).openAithronDb();
  const exists=db.objectStoreNames.contains(ACTIVITY_STORE);db.close();if(!exists)throw new Error('Almacén técnico no disponible.');
}

export async function logTechnicalActivity(entry){
  await ensureStore();
  const activity={
    id:`act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
    type:entry.type,
    description:entry.description,
    result:entry.result||'unknown',
    timestamp:Date.now(),
    source:entry.source||'manual',
    reference:entry.reference||null,
    metadata:entry.metadata||{},
  };
  await put(ACTIVITY_STORE,activity);
  await pruneOldActivity();
  return activity;
}

export async function getTechnicalActivity(filters={}){
  await ensureStore();
  const all=await getAll(ACTIVITY_STORE);
  let filtered=all;
  if(filters.type) filtered=filtered.filter(a=>a.type===filters.type);
  if(filters.result) filtered=filtered.filter(a=>a.result===filters.result);
  if(filters.from) filtered=filtered.filter(a=>a.timestamp>=filters.from);
  if(filters.to) filtered=filtered.filter(a=>a.timestamp<=filters.to);
  if(filters.source) filtered=filtered.filter(a=>a.source===filters.source);
  return filtered.sort((a,b)=>b.timestamp-a.timestamp).slice(0,200);
}

export async function getActivityDetail(id){
  await ensureStore();
  const all=await getAll(ACTIVITY_STORE);
  return all.find(a=>a.id===id)||null;
}

export async function getActivityStats(){
  const all=await getAll(ACTIVITY_STORE);
  return {
    total:all.length,
    byType:groupBy(all,'type'),
    byResult:groupBy(all,'result'),
    bySource:groupBy(all,'source'),
    recent24h:all.filter(a=>a.timestamp>Date.now()-24*60*60*1000).length,
    oldest:all.length?all.reduce((min,a)=>a.timestamp<min.timestamp?a:min).timestamp:null,
  };
}

export async function clearOldActivity(olderThan=30*24*60*60*1000){
  await ensureStore();
  const all=await getAll(ACTIVITY_STORE);
  const cutoff=Date.now()-olderThan;
  let removed=0;
  for(const a of all){
    if(a.timestamp<cutoff){
      await del(ACTIVITY_STORE,a.id);
      removed++;
    }
  }
  return {removed};
}

async function pruneOldActivity(){
  const all=await getAll(ACTIVITY_STORE);
  if(all.length<=MAX_ACTIVITY) return;
  all.sort((a,b)=>a.timestamp-b.timestamp);
  const toRemove=all.slice(0,all.length-MAX_ACTIVITY);
  for(const a of toRemove) await del(ACTIVITY_STORE,a.id);
}

function groupBy(arr,key){
  const groups={};
  for(const item of arr){
    const val=item[key]||'sin-dato';
    groups[val]=(groups[val]||0)+1;
  }
  return groups;
}

export const technicalActivityTypes=Object.freeze([
  {id:'diagnostic-run',label:'Diagnóstico ejecutado',icon:'stethoscope'},
  {id:'package-validation',label:'Validación de paquete',icon:'shield-check'},
  {id:'storage-error',label:'Error de almacenamiento',icon:'alert-circle'},
  {id:'state-change',label:'Cambio de estado verificado',icon:'git-commit'},
  {id:'sync-operation',label:'Operación de sincronización',icon:'refresh-cw'},
  {id:'resource-check',label:'Comprobación de recursos',icon:'search'},
  {id:'pwa-diagnostic',label:'Diagnóstico PWA',icon:'monitor'},
  {id:'service-check',label:'Comprobación de servicio',icon:'activity'},
  {id:'quality-check',label:'Validación de calidad',icon:'clipboard-check'},
  {id:'incident-detected',label:'Incidencia detectada',icon:'alert-triangle'},
  {id:'incident-resolved',label:'Incidencia resuelta',icon:'check-circle'},
  {id:'config-change',label:'Cambio de configuración',icon:'settings'},
  {id:'cache-cleared',label:'Caché limpiada',icon:'trash'},
  {id:'db-upgrade',label:'Actualización de BD',icon:'database'},
]);
