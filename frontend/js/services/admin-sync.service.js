import {getAll} from '../offline/database.js';
import {listPackages} from '../offline/package-manager.js';
export async function getSyncStatus(){const operations=await getAll('syncQueue'),packages=await listPackages(),reg=navigator.serviceWorker?await navigator.serviceWorker.getRegistration():null;return {connectivity:navigator.onLine,swSupported:'serviceWorker' in navigator,swRegistered:!!reg,swControlling:!!navigator.serviceWorker?.controller,pendingOperations:operations.filter(o=>['pendiente','error-temporal'].includes(o.status)).length,offlinePackages:packages.length,lastCheck:Date.now(),integrationStatus:'not-integrated',limitations:['Dispositivo actual','Sin confirmación de servidor']};}
export async function getPendingOperations(){return (await getAll('syncQueue')).filter(o=>['pendiente','error-temporal'].includes(o.status)).map(safeOperation);}
const safeOperation=o=>({opId:o.opId,type:o.type,status:o.status,attempts:o.attempts,createdAt:o.createdAt,lastAttempt:o.lastAttempt??null,entity:'Referencia local omitida',lastError:o.lastError?'Error local registrado; detalle omitido':null});
export async function getOperationDetail(id){const o=(await getAll('syncQueue')).find(o=>o.opId===id);return o?safeOperation(o):null;}
export async function retryOperation(){return {ok:false,reason:'no-backend'};}
export const getSyncSummary=getSyncStatus;
