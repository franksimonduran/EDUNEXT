import { getAll } from '../offline/database.js';
import { listPending } from '../offline/sync-queue.js';

export async function listSyncOperations(filters={}){
  const ops=await getAll('syncQueue');
  let filtered=ops;
  if(filters.status) filtered=filtered.filter(o=>o.status===filters.status);
  if(filters.type) filtered=filtered.filter(o=>o.type===filters.type);
  if(filters.from) filtered=filtered.filter(o=>o.createdAt>=filters.from);
  if(filters.to) filtered=filtered.filter(o=>o.createdAt<=filters.to);
  return filtered.map(op=>({
    opId:op.opId,
    type:op.type,
    entity:'Referencia omitida',
    status:op.status,
    createdAt:op.createdAt,
    lastAttempt:op.lastAttempt||null,
    attempts:op.attempts,
    lastError:op.lastError?'Error local registrado; detalle omitido':null,
    confirmed:false,
    source:'cola-local',
  }));
}

export async function getOperationTypes(){
  return [
    {id:'draft-created',label:'Borrador creado',category:'educativo'},
    {id:'proposal-created',label:'Propuesta administrativa',category:'administrativo'},
    {id:'review-completed',label:'Revisión completada',category:'revision'},
    {id:'evaluation-registered',label:'Evaluación registrada',category:'evaluacion'},
    {id:'resource-added',label:'Recurso agregado',category:'recurso'},
    {id:'validation-executed',label:'Validación ejecutada',category:'validacion'},
    {id:'config-modified',label:'Configuración modificada',category:'configuracion'},
    {id:'package-downloaded',label:'Paquete descargado',category:'paquete'},
    {id:'package-verified',label:'Paquete verificado',category:'paquete'},
    {id:'sync-attempted',label:'Intento de sincronización',category:'sync'},
  ];
}

export function formatOperationStatus(status){
  const labels={
    'pendiente':'Pendiente',
    'en-proceso':'En proceso',
    'error-temporal':'Error temporal',
    'confirmado':'Confirmado',
  };
  return labels[status]||status;
}

export function formatOperationType(type){
  const types={
    'draft-created':'Borrador creado',
    'proposal-created':'Propuesta administrativa',
    'review-completed':'Revisión completada',
    'evaluation-registered':'Evaluación registrada',
    'resource-added':'Recurso agregado',
    'validation-executed':'Validación ejecutada',
    'config-modified':'Configuración modificada',
    'package-downloaded':'Paquete descargado',
    'package-verified':'Paquete verificado',
    'sync-attempted':'Intento de sincronización',
  };
  return types[type]||type;
}
