import { getAll, put, del } from '../offline/database.js';

const INCIDENTS_STORE='technicalIncidents';

async function ensureStore(){
  const db=await (await import('../offline/database-schema.js')).openAithronDb();
  const exists=db.objectStoreNames.contains(INCIDENTS_STORE);db.close();if(!exists)throw new Error('Almacén técnico no disponible en el esquema compartido.');
}

function generateIncidentId(category,severity){
  return `inc-${category}-${severity}`;
}

export async function scanForIncidents(){
  await ensureStore();
  const incidents=[];
  const now=Date.now();
  
  const {getSyncStatus}=await import('./admin-sync.service.js');
  const syncStatus=await getSyncStatus();
  
  if(!navigator.onLine){
    incidents.push(createIncident('connectivity','offline','warning','Navegador reporta desconexión','El navegador reporta estado offline','connectivity-check'));
  }
  
  if(!syncStatus.swRegistered){
    incidents.push(createIncident('serviceWorker','sw-not-registered','warning','Service Worker no registrado','El SW no está registrado en este navegador','sw-check'));
  }else if(!syncStatus.swControlling){
    incidents.push(createIncident('serviceWorker','sw-not-controlling','warning','SW no controla página','Página no está bajo control del SW','sw-check'));
  }
  
  if(syncStatus.pendingOperations>0){
    incidents.push(createIncident('syncOperations','pending-operations','info',`${syncStatus.pendingOperations} operaciones pendientes`,'Hay operaciones en cola sin sincronizar','sync-queue-check'));
  }
  
  const {runPWADiagnostics}=await import('./admin-pwa-diagnostics.service.js');
  const pwaResults=await runPWADiagnostics();
  for(const r of pwaResults){
    if(r.result==='error'){
      incidents.push(createIncident('pwa',r.id,'error',r.name+' falló',r.error||'Comprobación fallida',`pwa-${r.id}`));
    }else if(r.result==='warning'){
      incidents.push(createIncident('pwa',r.id,'warning',r.name+' con advertencia',r.evidence,`pwa-${r.id}`));
    }
  }
  
  const {runFullDiagnostics}=await import('./admin-technical-diagnostics.service.js');
  const diagResults=await runFullDiagnostics();
  for(const r of diagResults.tests){
    if(r.result==='error'){
      incidents.push(createIncident('diagnostics',r.id,'error',r.name+' falló',r.error||'Comprobación fallida',`diag-${r.id}`));
    }else if(r.result==='warning'){
      incidents.push(createIncident('diagnostics',r.id,'warning',r.name+' con advertencia',r.evidence,`diag-${r.id}`));
    }
  }
  
  // Academic records are not inspected by technical diagnostics.
  
  for(const inc of incidents){
    await saveIncident(inc);
  }
  
  return incidents;
}

function createIncident(category,rule,severity,title,description,source){
  return {
    id:generateIncidentId(category+'-'+rule,severity),
    category,
    rule,
    severity,
    title,
    description,
    source,
    detectedAt:Date.now(),
    lastDetectedAt:Date.now(),
    status:'open',
    count:1,
    reviewed:false,
    resolvedAt:null,
    resolution:null,
  };
}

export async function getIncidents(filters={}){
  await ensureStore();
  const all=await getAll(INCIDENTS_STORE);
  let filtered=all;
  if(filters.category) filtered=filtered.filter(i=>i.category===filters.category);
  if(filters.severity) filtered=filtered.filter(i=>i.severity===filters.severity);
  if(filters.status) filtered=filtered.filter(i=>i.status===filters.status);
  if(filters.from) filtered=filtered.filter(i=>i.detectedAt>=filters.from);
  if(filters.to) filtered=filtered.filter(i=>i.detectedAt<=filters.to);
  return filtered.sort((a,b)=>b.lastDetectedAt-a.lastDetectedAt);
}

export async function getIncidentDetail(id){
  await ensureStore();
  const all=await getAll(INCIDENTS_STORE);
  return all.find(i=>i.id===id)||null;
}

export async function saveIncident(incident){
  await ensureStore();
  const existing=await getAll(INCIDENTS_STORE).then(arr=>arr.find(i=>i.category===incident.category && i.rule===incident.rule && i.severity===incident.severity));
  let saved;
  if(existing){
    saved={...existing,lastDetectedAt:Date.now(),count:existing.count+1,status:existing.status==='resolved'?'reopened':existing.status};
    await put(INCIDENTS_STORE,saved);
  }else{
    saved=incident;
    await put(INCIDENTS_STORE,saved);
  }
  return saved;
}

export async function markIncidentReviewed(id){
  await ensureStore();
  const all=await getAll(INCIDENTS_STORE);
  const inc=all.find(i=>i.id===id);
  if(inc){
    inc.reviewed=true;
    await put(INCIDENTS_STORE,inc);
    return inc;
  }
  return null;
}

export async function markIncidentResolved(id,resolution){
  throw new Error('La resolución requiere repetir la comprobación y obtener evidencia; no se permite resolución manual.');
}

export async function getIncidentStats(){
  const incidents=await getIncidents();
  return {
    total:incidents.length,
    open:incidents.filter(i=>i.status==='open').length,
    resolved:incidents.filter(i=>i.status==='resolved').length,
    reviewed:incidents.filter(i=>i.reviewed).length,
    bySeverity:{
      critical:incidents.filter(i=>i.severity==='critical').length,
      error:incidents.filter(i=>i.severity==='error').length,
      warning:incidents.filter(i=>i.severity==='warning').length,
      info:incidents.filter(i=>i.severity==='info').length,
    },
    byCategory:groupBy(incidents,'category'),
    oldestOpen:incidents.filter(i=>i.status==='open').reduce((min,i)=>!min||i.detectedAt<min.detectedAt?i:min,null),
  };
}

function groupBy(arr,key){
  const groups={};
  for(const item of arr){
    const val=item[key]||'sin-dato';
    groups[val]=(groups[val]||0)+1;
  }
  return groups;
}

export async function clearResolvedIncidents(olderThan=7*24*60*60*1000){
  await ensureStore();
  const all=await getAll(INCIDENTS_STORE);
  const cutoff=Date.now()-olderThan;
  let removed=0;
  for(const inc of all){
    if(inc.status==='resolved' && inc.resolvedAt && inc.resolvedAt<cutoff){
      await del(INCIDENTS_STORE,inc.id);
      removed++;
    }
  }
  return {removed};
}
