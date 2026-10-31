export function generateTechnicalSummary(data){
  const lines=['=== EDUNEXT - Resumen Técnico Local ===',''];
  lines.push(`Generado: ${new Date().toISOString()}`);
  lines.push(`Alcance: Solo dispositivo actual`);
  lines.push(`Datos: Demostración · Sin información real de estudiantes`);
  lines.push('');
  
  if(data.sync){
    lines.push('--- Sincronización ---');
    lines.push(`Conectividad: ${data.sync.connectivity?'online':'offline'}`);
    lines.push(`Operaciones pendientes: ${data.sync.pendingOperations||0}`);
    lines.push(`Paquetes offline: ${data.sync.offlinePackages||0}`);
    lines.push(`SW registrado: ${data.sync.swRegistered?'Sí':'No'}`);
    lines.push(`SW controlando: ${data.sync.swControlling?'Sí':'No'}`);
    lines.push('');
  }
  
  if(data.pwa){
    lines.push('--- PWA ---');
    lines.push(`SW registrado: ${data.pwa.swRegistered?'Sí':'No'}`);
    lines.push(`SW controlando: ${data.pwa.swControlling?'Sí':'No'}`);
    lines.push(`Manifiesto válido: ${data.pwa.manifestValid?'Sí':'No'}`);
    lines.push(`Cache disponible: ${data.pwa.cacheAvailable?'Sí':'No'}`);
    lines.push(`Instalable: ${data.pwa.installable?'Sí':'No'}`);
    lines.push(`Modo standalone: ${data.pwa.standalone?'Sí':'No'}`);
    lines.push('');
  }
  
  if(data.diagnostics){
    lines.push('--- Diagnóstico ---');
    lines.push(`Total pruebas: ${data.diagnostics.total||0}`);
    lines.push(`Correctas: ${data.diagnostics.success||0}`);
    lines.push(`Advertencias: ${data.diagnostics.warning||0}`);
    lines.push(`Errores: ${data.diagnostics.error||0}`);
    lines.push(`Tasa éxito: ${data.diagnostics.passRate||0}%`);
    lines.push('');
  }
  
  if(data.incidents){
    lines.push('--- Incidencias ---');
    lines.push(`Total: ${data.incidents.total||0}`);
    lines.push(`Abiertas: ${data.incidents.open||0}`);
    lines.push(`Críticas: ${data.incidents.bySeverity?.critical||0}`);
    lines.push(`Errores: ${data.incidents.bySeverity?.error||0}`);
    lines.push(`Advertencias: ${data.incidents.bySeverity?.warning||0}`);
    lines.push(`Informativas: ${data.incidents.bySeverity?.info||0}`);
    lines.push('');
  }
  
  if(data.storage){
    lines.push('--- Almacenamiento ---');
    lines.push(`Uso: ${data.storage.estimate?.usedMB||0} MB`);
    lines.push(`Cuota: ${data.storage.estimate?.quotaMB||0} MB`);
    lines.push(`Porcentaje: ${data.storage.estimate?.percentUsed||'?'}%`);
    lines.push(`Persistencia: ${data.storage.persistence?.persisted?'Sí':'No'}`);
    lines.push('');
  }
  
  lines.push('--- Metadatos ---');
  lines.push(`Generado: ${new Date().toISOString()}`);
  lines.push('Alcance: Solo dispositivo actual');
  lines.push('Datos: Demostración · Sin información real de estudiantes');
  
  return lines.join('\n');
}

export function generateSafeJSON(data){
  const safe={};
  if(data.sync) safe.sync={pendingOperations:data.sync.pendingOperations,offlinePackages:data.sync.offlinePackages,swRegistered:data.sync.swRegistered,swControlling:data.sync.swControlling};
  if(data.pwa) safe.pwa={swRegistered:data.pwa.swRegistered,swControlling:data.pwa.swControlling,manifestValid:data.pwa.manifestValid,standalone:data.pwa.standalone};
  if(data.diagnostics) safe.diagnostics={total:data.diagnostics.total,success:data.diagnostics.success,warning:data.diagnostics.warning,error:data.diagnostics.error};
  if(data.incidents) safe.incidents={total:data.incidents.total,open:data.incidents.open,bySeverity:data.incidents.bySeverity};
  if(data.storage) safe.storage={usedMB:data.storage.estimate?.usedMB,quotaMB:data.storage.estimate?.quotaMB,percentUsed:data.storage.estimate?.percentUsed,persisted:data.storage.persistence?.persisted};
  safe.metadata={generatedAt:new Date().toISOString(),version:'demo',scope:'local-device-only'};
  return JSON.stringify(safe,null,2);
}

export function sanitizeForExport(obj,allowedKeys){
  if(!obj || typeof obj!=='object') return obj;
  if(Array.isArray(obj)) return obj.map(item=>sanitizeForExport(item,allowedKeys));
  const sanitized={};
  for(const [key,value] of Object.entries(obj)){
    if(allowedKeys && !allowedKeys.includes(key)) continue;
    if(typeof value==='object' && value!==null){
      sanitized[key]=sanitizeForExport(value,allowedKeys);
    }else if(typeof value!=='function'){
      sanitized[key]=value;
    }
  }
  return sanitized;
}

export const EXPORT_ALLOWED_KEYS=[
  'id','type','name','status','category','severity','title','description',
  'timestamp','createdAt','updatedAt','detectedAt','resolvedAt',
  'result','evidence','error','duration','recommendation',
  'count','source','reference','metadata',
  'total','success','warning','error','skipped',
  'usedMB','quotaMB','percentUsed','persisted',
  'pendingOperations','offlinePackages','swRegistered','swControlling',
  'connectivity','swRegistered','swControlling','manifestValid','standalone',
  'total','success','warning','error','passRate',
  'bySeverity','byCategory',
];

export function copyToClipboard(text){
  return navigator.clipboard.writeText(text).then(()=>true).catch(()=>false);
}

export function downloadTextFile(text,filename){
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function downloadJSONFile(obj,filename){
  return downloadTextFile(JSON.stringify(obj,null,2),filename);
}
export async function collectTechnicalSummary(){const {getSyncStatus}=await import('../services/admin-sync.service.js'),{getPWASummary}=await import('../services/admin-pwa-diagnostics.service.js'),{runFullDiagnostics}=await import('../services/admin-technical-diagnostics.service.js'),{getIncidentStats}=await import('../services/admin-technical-incidents.service.js'),{getStorageSummary}=await import('../services/admin-storage-diagnostics.service.js');const [sync,pwa,diag,incidents,storage]=await Promise.all([getSyncStatus(),getPWASummary(),runFullDiagnostics(),getIncidentStats(),getStorageSummary()]);return {sync,pwa,diagnostics:diag.summary,incidents,storage};}
export const formatSummaryForDisplay=generateTechnicalSummary;
