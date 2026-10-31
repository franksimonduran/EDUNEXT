export const SyncOperationStatus=Object.freeze({
  PENDING:'pendiente',
  IN_PROGRESS:'en-proceso',
  TEMPORARY_ERROR:'error-temporal',
  CONFIRMED:'confirmado',
});

export const SyncOperationType=Object.freeze({
  DRAFT_CREATED:'draft-created',
  PROPOSAL_CREATED:'proposal-created',
  REVIEW_COMPLETED:'review-completed',
  EVALUATION_REGISTERED:'evaluation-registered',
  RESOURCE_ADDED:'resource-added',
  VALIDATION_EXECUTED:'validation-executed',
  CONFIG_MODIFIED:'config-modified',
  PACKAGE_DOWNLOADED:'package-downloaded',
  PACKAGE_VERIFIED:'package-verified',
  SYNC_ATTEMPTED:'sync-attempted',
});

export function canRetryOperation(op){
  return op.status===SyncOperationStatus.PENDING || op.status===SyncOperationStatus.TEMPORARY_ERROR;
}

export function getStatusLabel(status){
  const labels={
    [SyncOperationStatus.PENDING]:'Pendiente',
    [SyncOperationStatus.IN_PROGRESS]:'En proceso',
    [SyncOperationStatus.TEMPORARY_ERROR]:'Error temporal',
    [SyncOperationStatus.CONFIRMED]:'Confirmado',
  };
  return labels[status]||status;
}

export function getTypeLabel(type){
  const labels={
    [SyncOperationType.DRAFT_CREATED]:'Borrador creado',
    [SyncOperationType.PROPOSAL_CREATED]:'Propuesta administrativa',
    [SyncOperationType.REVIEW_COMPLETED]:'Revisión completada',
    [SyncOperationType.EVALUATION_REGISTERED]:'Evaluación registrada',
    [SyncOperationType.RESOURCE_ADDED]:'Recurso agregado',
    [SyncOperationType.VALIDATION_EXECUTED]:'Validación ejecutada',
    [SyncOperationType.CONFIG_MODIFIED]:'Configuración modificada',
    [SyncOperationType.PACKAGE_DOWNLOADED]:'Paquete descargado',
    [SyncOperationType.PACKAGE_VERIFIED]:'Paquete verificado',
    [SyncOperationType.SYNC_ATTEMPTED]:'Intento de sincronización',
  };
  return labels[type]||type;
}

export function getStatusColor(status){
  const colors={
    [SyncOperationStatus.PENDING]:'#f59e0b',
    [SyncOperationStatus.IN_PROGRESS]:'#3b82f6',
    [SyncOperationStatus.TEMPORARY_ERROR]:'#ef4444',
    [SyncOperationStatus.CONFIRMED]:'#10b981',
  };
  return colors[status]||'#6b7280';
}

export function isTerminalStatus(status){
  return status===SyncOperationStatus.CONFIRMED;
}

export function getRetryableStatuses(){
  return [SyncOperationStatus.PENDING, SyncOperationStatus.TEMPORARY_ERROR];
}