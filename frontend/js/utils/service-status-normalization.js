export const ServiceState=Object.freeze({
  AVAILABLE:'available',
  UNAVAILABLE:'unavailable',
  PENDING:'pending',
  NOT_INTEGRATED:'not-integrated',
  UNKNOWN:'unknown',
  LOCALLY_AVAILABLE:'locally-available',
  ERROR:'error',
  NOT_CONFIGURED:'not-configured',
});

export function normalizeServiceState(raw){
  if(!raw) return ServiceState.UNKNOWN;
  const s=String(raw).toLowerCase();
  if(['available','ok','success','up','healthy','connected','registered','active','controlling'].includes(s)) return ServiceState.AVAILABLE;
  if(['unavailable','down','offline','failed','error','missing','absent','not-found'].includes(s)) return ServiceState.UNAVAILABLE;
  if(['pending','waiting','queued','in-progress','processing'].includes(s)) return ServiceState.PENDING;
  if(['not-integrated','not-configured','unconfigured','disabled','planned','future','demo'].includes(s)) return ServiceState.NOT_INTEGRATED;
  if(['unknown','unavailable','unsupported'].includes(s)) return ServiceState.UNKNOWN;
  return ServiceState.UNKNOWN;
}

export function getStateLabel(state){
  const labels={
    [ServiceState.AVAILABLE]:'Disponible',
    [ServiceState.UNAVAILABLE]:'No disponible',
    [ServiceState.PENDING]:'Pendiente',
    [ServiceState.NOT_INTEGRATED]:'Sin integrar',
    [ServiceState.UNKNOWN]:'Desconocido',
    [ServiceState.LOCALLY_AVAILABLE]:'Disponible localmente',
    [ServiceState.ERROR]:'Error',
    [ServiceState.NOT_CONFIGURED]:'Sin configurar',
  };
  return labels[state]||state;
}

export function getStateColor(state){
  const colors={
    [ServiceState.AVAILABLE]:'#10b981',
    [ServiceState.UNAVAILABLE]:'#ef4444',
    [ServiceState.PENDING]:'#f59e0b',
    [ServiceState.NOT_INTEGRATED]:'#6b7280',
    [ServiceState.UNKNOWN]:'#9ca3af',
    [ServiceState.LOCALLY_AVAILABLE]:'#3b82f6',
    [ServiceState.ERROR]:'#ef4444',
    [ServiceState.NOT_CONFIGURED]:'#6b7280',
  };
  return colors[state]||'#9ca3af';
}

export function isServiceOperational(state){
  return state===ServiceState.AVAILABLE || state===ServiceState.LOCALLY_AVAILABLE;
}

export function isServiceProblematic(state){
  return state===ServiceState.UNAVAILABLE || state===ServiceState.ERROR;
}

export function getServiceStatusIcon(state){
  const icons={
    [ServiceState.AVAILABLE]:'check-circle',
    [ServiceState.UNAVAILABLE]:'x-circle',
    [ServiceState.PENDING]:'clock',
    [ServiceState.NOT_INTEGRATED]:'plug-x',
    [ServiceState.UNKNOWN]:'help-circle',
    [ServiceState.LOCALLY_AVAILABLE]:'hard-drive',
    [ServiceState.ERROR]:'alert-triangle',
    [ServiceState.NOT_CONFIGURED]:'settings',
  };
  return icons[state]||'help-circle';
}