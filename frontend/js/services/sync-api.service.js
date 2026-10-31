import {apiRequest} from './auth.service.js';

export const syncStatus=()=>apiRequest('/sync/status');
export const syncBootstrap=()=>apiRequest('/sync/bootstrap');
export const syncOperationReceipt=id=>apiRequest(`/sync/operations/${encodeURIComponent(id)}`);
export const pushSyncOperations=(context,operations)=>apiRequest('/sync/operations',{
 method:'POST',csrf:true,body:{expected_account_id:context.account_context_id,
  expected_institution_id:context.institution_context_id,operations},retry:false,
});
