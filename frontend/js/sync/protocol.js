// Pure finite protocol. These checks never replace server authorization.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function requireContext(context){
 if(!context||!uuid.test(context.account_context_id)||!uuid.test(context.institution_context_id)||context.protocol_version!==1)
  throw new TypeError('Contexto autenticado de sincronización requerido.');
 return `${context.institution_context_id.toLowerCase()}:${context.account_context_id.toLowerCase()}`;
}
export function operationBody(operation){
 const body=operation.body;
 if(!body||Object.keys(body).sort().join(',')!=='client_operation_id,lesson_version_id,operation_type,resource_id,schema_version'
  ||body.operation_type!=='lesson.progress.complete'||body.schema_version!==1
  ||![body.client_operation_id,body.resource_id,body.lesson_version_id].every(value=>typeof value==='string'&&uuid.test(value)))
  throw new TypeError('Operación no permitida por el protocolo.');
 return body;
}
export function ownedOperations(operations,context){
 const scope=requireContext(context);
 return operations.filter(operation=>operation.protocolVersion===1&&operation.accountScope===scope);
}
export function validateReceipt(operation,receipt){
 const body=operationBody(operation);
 if(!receipt||receipt.client_operation_id!==body.client_operation_id
  ||!['applied','already_applied'].includes(receipt.status)
  ||receipt.server_resource_id!==body.resource_id||receipt.server_version!==body.lesson_version_id
  ||typeof receipt.confirmed_at!=='string'||!Number.isFinite(Date.parse(receipt.confirmed_at)))
  throw new TypeError('No existe confirmación válida para esta operación.');
 return receipt;
}
export function retryDelay(attempt,random=Math.random){
 if(!Number.isInteger(attempt)||attempt<1||attempt>5)throw new RangeError('Reintento fuera de límite.');
 return Math.min(60000,1000*2**(attempt-1))*(0.75+0.5*random());
}
export function failureState(status){
 if(status===401)return 'blocked_auth';
 if(status===409)return 'conflict';
 if([400,403,404,413,422].includes(status))return 'rejected';
 return 'retryable_error';
}
export function nextRetryAt(attempt,retryAfter,now=Date.now()){
 const local=now+retryDelay(attempt);
 if(typeof retryAfter!=='string'||!retryAfter.trim())return local;
 const value=retryAfter.trim();
 const specified=/^\d+$/.test(value)?now+Number(value)*1000:Date.parse(value);
 return Number.isFinite(specified)?Math.max(local,specified):local;
}
