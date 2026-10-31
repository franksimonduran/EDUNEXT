import {apiRequest} from './auth.service.js';

export const getAICapabilities=()=>apiRequest('/ai/capabilities');
export const getTutorContexts=()=>apiRequest('/ai/tutor/contexts');
export const getAIUsage=()=>apiRequest('/ai/usage/me');
export const getAIConfiguration=()=>apiRequest('/ai/configuration');
export const updateAIConfiguration=body=>apiRequest('/ai/configuration',{method:'PATCH',body});
export const getInstitutionAIUsage=()=>apiRequest('/ai/usage/institution');
export const findDictionaryEntries=(q,language='es')=>apiRequest(`/ai/dictionary/search?${new URLSearchParams({q,language,page_size:20})}`);
export const getPronunciationReferences=()=>apiRequest('/ai/pronunciation/references');
export const getPronunciationReference=id=>apiRequest(`/ai/pronunciation/references/${encodeURIComponent(id)}`);
export const beginPronunciationReference=id=>apiRequest('/ai/pronunciation/sessions',{method:'POST',body:{dictionary_entry_id:id}});
export const aiOperationKey=()=>crypto.randomUUID();
export const sendTutorMessage=(body,key)=>apiRequest('/ai/tutor/messages',{method:'POST',body,headers:{'Idempotency-Key':key}});
export const translateWithAI=(body,key)=>apiRequest('/ai/translate',{method:'POST',body,headers:{'Idempotency-Key':key}});
