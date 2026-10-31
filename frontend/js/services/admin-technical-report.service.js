export function generateTechnicalSummary(data){
  const sections=[
    ['Versión EDUNEXT',data.version||'desconocida'],
    ['Fecha del resumen',new Date().toISOString()],
    ['Navegador',navigator.userAgent],
    ['Idioma',navigator.language],
    ['Zona horaria',Intl.DateTimeFormat().resolvedOptions().timeZone],
    ['Conectividad',navigator.onLine?'online':'offline'],
    ['Service Worker',navigator.serviceWorker.controller?'controlando':'sin control'],
    ['IndexedDB',typeof indexedDB!=='undefined'?'disponible':'no disponible'],
    ['Cache Storage','caches' in window?'disponible':'no disponible'],
    ['StorageManager','storage' in navigator && 'estimate' in navigator.storage?'disponible':'no disponible'],
  ];
  
  if(data.sync){
    sections.push(
      ['Operaciones pendientes',data.sync.pendingOperations||0],
      ['Paquetes offline',data.sync.offlinePackages||0],
      ['SW registrado',data.sync.swRegistered?'sí':'no'],
      ['SW controlando',data.sync.swControlling?'sí':'no'],
    );
  }
  
  if(data.diagnostics){
    sections.push(
      ['Pruebas ejecutadas',data.diagnostics.total||0],
      ['Correctas',data.diagnostics.success||0],
      ['Advertencias',data.diagnostics.warning||0],
      ['Errores',data.diagnostics.error||0],
    );
  }
  
  if(data.incidents){
    sections.push(
      ['Incidencias totales',data.incidents.total||0],
      ['Abiertas',data.incidents.open||0],
      ['Críticas',data.incidents.bySeverity?.critical||0],
      ['Errores',data.incidents.bySeverity?.error||0],
      ['Advertencias',data.incidents.bySeverity?.warning||0],
    );
  }
  
  if(data.storage){
    sections.push(
      ['Uso almacenamiento',data.storage.estimate?.usedMB+' MB'],
      ['Cuota',data.storage.estimate?.quotaMB+' MB'],
      ['Porcentaje',data.storage.estimate?.percentUsed+'%'],
      ['Persistencia',data.storage.persistence?.persisted?'sí':'no'],
    );
  }
  
  return sections.map(([k,v])=>`${k}: ${v}`).join('\n');
}

export function generateSafeJSON(data){
  const safe={};
  if(data.sync) safe.sync={pendingOperations:data.sync.pendingOperations,offlinePackages:data.sync.offlinePackages,swRegistered:data.sync.swRegistered,swControlling:data.sync.swControlling};
  if(data.diagnostics) safe.diagnostics={total:data.diagnostics.total,success:data.diagnostics.success,warning:data.diagnostics.warning,error:data.diagnostics.error};
  if(data.incidents) safe.incidents={total:data.incidents.total,open:data.incidents.open,bySeverity:data.incidents.bySeverity};
  if(data.storage) safe.storage={usedMB:data.storage.estimate?.usedMB,quotaMB:data.storage.estimate?.quotaMB,percentUsed:data.storage.estimate?.percentUsed,persisted:data.storage.persistence?.persisted};
  if(data.pwa) safe.pwa={swRegistered:data.pwa.swRegistered,swControlling:data.pwa.swControlling,manifestValid:data.pwa.manifestValid,standalone:data.pwa.standalone};
  safe.metadata={generatedAt:new Date().toISOString(),version:'demo',scope:'local-device-only'};
  return JSON.stringify(safe,null,2);
}

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

export async function collectTechnicalSummary(){
  const {getSyncSummary}=await import('./admin-sync.service.js');
  const {runPWADiagnostics}=await import('./admin-pwa-diagnostics.service.js');
  const {runFullDiagnostics}=await import('./admin-technical-diagnostics.service.js');
  const {getIncidentStats}=await import('./admin-technical-incidents.service.js');
  const {getStorageSummary}=await import('./admin-storage-diagnostics.service.js');
  
  const [sync,pwa,diag,incidents,storage]=await Promise.all([
    getSyncSummary(),
    getPWASummary(),
    runFullDiagnostics(),
    getIncidentStats(),
    getStorageSummary(),
  ]);
  
  return {sync,pwa,diagnostics:diag.summary,incidents,storage};
}

export function formatSummaryForDisplay(summary){
  const lines=['=== EDUNEXT - Resumen Técnico Local ===',''];
  
  if(summary.sync){
    lines.push('--- Sincronización ---');
    lines.push(`Conectividad: ${summary.sync.connectivity?'online':'offline'}`);
    lines.push(`Operaciones pendientes: ${summary.sync.operationsPending}`);
    lines.push(`Paquetes offline: ${summary.sync.packagesOffline}`);
    lines.push(`SW registrado: ${summary.sync.swRegistered?'Sí':'No'}`);
    lines.push(`SW controlando: ${summary.sync.swControlling?'Sí':'No'}`);
    lines.push('');
  }
  
  if(summary.pwa){
    lines.push('--- PWA ---');
    lines.push(`SW registrado: ${summary.pwa.swRegistered?'Sí':'No'}`);
    lines.push(`SW controlando: ${summary.pwa.swControlling?'Sí':'No'}`);
    lines.push(`Manifiesto válido: ${summary.pwa.manifestValid?'Sí':'No'}`);
    lines.push(`Cache disponible: ${summary.pwa.cacheAvailable?'Sí':'No'}`);
    lines.push(`Instalable: ${summary.pwa.installable?'Sí':'No'}`);
    lines.push(`Modo standalone: ${summary.pwa.standalone?'Sí':'No'}`);
    lines.push('');
  }
  
  if(summary.diagnostics){
    lines.push('--- Diagnóstico ---');
    lines.push(`Total pruebas: ${summary.diagnostics.total}`);
    lines.push(`Correctas: ${summary.diagnostics.success}`);
    lines.push(`Advertencias: ${summary.diagnostics.warning}`);
    lines.push(`Errores: ${summary.diagnostics.error}`);
    lines.push(`Tasa éxito: ${summary.diagnostics.passRate}%`);
    lines.push('');
  }
  
  if(summary.incidents){
    lines.push('--- Incidencias ---');
    lines.push(`Total: ${summary.incidents.total}`);
    lines.push(`Abiertas: ${summary.incidents.open}`);
    lines.push(`Críticas: ${summary.incidents.bySeverity?.critical||0}`);
    lines.push(`Errores: ${summary.incidents.bySeverity?.error||0}`);
    lines.push(`Advertencias: ${summary.incidents.bySeverity?.warning||0}`);
    lines.push(`Informativas: ${summary.incidents.bySeverity?.info||0}`);
    lines.push('');
  }
  
  if(summary.storage){
    lines.push('--- Almacenamiento ---');
    lines.push(`Uso: ${summary.storage.estimate?.usedMB} MB`);
    lines.push(`Cuota: ${summary.storage.estimate?.quotaMB} MB`);
    lines.push(`Porcentaje: ${summary.storage.estimate?.percentUsed}%`);
    lines.push(`Persistencia: ${summary.storage.persistence?.persisted?'Sí':'No'}`);
    lines.push('');
  }
  
  lines.push('--- Metadatos ---');
  lines.push(`Generado: ${new Date().toISOString()}`);
  lines.push('Alcance: Solo dispositivo actual');
  lines.push('Datos: Demostración · Sin información real de estudiantes');
  
  return lines.join('\n');
}