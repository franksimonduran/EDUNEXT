import {apiRequest} from './auth.service.js';

const sources=new Set(['me.activities','monitor.assignments','institution.courses',
 ...['me','monitor','institution'].flatMap(scope=>['practices','assessments','competencies'].map(kind=>`${scope}.${kind}`))]);

export const insightRuleCatalog=(options={})=>apiRequest('/insights/rules/catalog',options);
export function readInsights(code,filters={},options={}){
 if(!sources.has(code))throw new TypeError('Fuente de Insights no disponible.');
 const query=new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==''&&value!==null&&value!==undefined));
 return apiRequest(`/insights/${code.replace('.','/')}?${query}`,options);
}
