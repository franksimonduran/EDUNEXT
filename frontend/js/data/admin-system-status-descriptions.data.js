export const systemStatusLabels=Object.freeze({
  available:{label:'Disponible',description:'Comprobación real exitosa. El servicio o recurso está operativo.',icon:'check-circle',color:'#10b981'},
  unavailable:{label:'No disponible',description:'Comprobación real fallida. El servicio no responde o no está accesible.',icon:'x-circle',color:'#ef4444'},
  pending:{label:'Pendiente',description:'Operación existente todavía no completada.',icon:'clock',color:'#f59e0b'},
  notIntegrated:{label:'Sin integrar',description:'Funcionalidad futura sin implementación backend.',icon:'plug-x',color:'#6b7280'},
  unknown:{label:'Desconocido',description:'No puede determinarse con la información disponible.',icon:'help-circle',color:'#9ca3af'},
  locallyAvailable:{label:'Disponible localmente',description:'Existe en el dispositivo actual.',icon:'hard-drive',color:'#3b82f6'},
  errorDetected:{label:'Error detectado',description:'Fallo confirmado mediante una comprobación.',icon:'alert-triangle',color:'#ef4444'},
  notConfigured:{label:'Sin configurar',description:'No hay configuración de backend disponible.',icon:'settings',color:'#6b7280'},
  demo:{label:'Demostración',description:'Vista de demostración · Sin efectos reales.',icon:'info',color:'#8b5cf6'},
});

export function getStatusInfo(status){
  return systemStatusLabels[status]||{label:status,description:'Estado no reconocido',icon:'help-circle',color:'#9ca3af'};
}

export function formatStatusBadge(status){
  const info=getStatusInfo(status);
  return `<span class="status-badge" style="--badge-color:${info.color}"><span class="status-icon" data-icon="${info.icon}"></span>${info.label}</span>`;
}

export const syncStatusLabels=Object.freeze({
  'pendiente':{label:'Pendiente',color:'#f59e0b'},
  'en-proceso':{label:'En proceso',color:'#3b82f6'},
  'error-temporal':{label:'Error temporal',color:'#ef4444'},
  'confirmado':{label:'Confirmado',color:'#10b981'},
  'desconocido':{label:'Desconocido',color:'#6b7280'},
});

export const packageStatusLabels=Object.freeze({
  'preparado':{label:'Preparado para empaquetado',description:'El manifiesto superó la comprobación de preparación.',color:'#3b82f6'},
  'descargado':{label:'Descargado localmente',description:'Los recursos fueron almacenados correctamente.',color:'#10b981'},
  'verificado':{label:'Verificado',description:'Se ejecutaron verificaciones de integridad compatibles.',color:'#8b5cf6'},
  'incompleto':{label:'Incompleto',description:'Faltan recursos necesarios.',color:'#f59e0b'},
  'version-diferente':{label:'Versión diferente',description:'La versión local difiere de una referencia válida conocida.',color:'#ef4444'},
  'sin-verificar':{label:'Sin verificar',description:'No existen pruebas suficientes.',color:'#6b7280'},
});

export const diagnosticResultLabels=Object.freeze({
  success:{label:'Correcto',color:'#10b981'},
  warning:{label:'Advertencia',color:'#f59e0b'},
  error:{label:'Error',color:'#ef4444'},
  skipped:{label:'No comprobado',color:'#6b7280'},
});

export function getSeverityInfo(severity){
  const map={
    info:{label:'Informativa',color:'#3b82f6',icon:'info'},
    warning:{label:'Advertencia',color:'#f59e0b',icon:'alert-triangle'},
    error:{label:'Error',color:'#ef4444',icon:'x-circle'},
    critical:{label:'Crítica',color:'#991b1b',icon:'alert-octagon'},
  };
  return map[severity]||map.info;
}

export const connectivityLabels=Object.freeze({
  online:{label:'Con conexión de red',color:'#10b981'},
  offline:{label:'Sin conexión',color:'#ef4444'},
});

export function formatConnectivityBadge(online){
  const info=connectivityLabels[online?'online':'offline'];
  return `<span class="connectivity-badge" style="--badge-color:${info.color}">${info.label}</span>`;
}