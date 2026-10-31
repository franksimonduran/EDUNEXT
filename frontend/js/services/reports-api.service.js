import {apiRequest,apiDownload} from './auth.service.js';

export const reportCatalog=()=>apiRequest('/reports/catalog');
export const reportContexts=()=>apiRequest('/reports/monitor/context?page_size=100');
export const academicReportContexts=()=>apiRequest('/reports/institution/context');
export const readReport=(code,filters={})=>{
 if(!/^(me|monitor|institution)\.[a-z_]+$/.test(code))throw new TypeError('Código de reporte no válido.');
 return apiRequest(`/reports/${code.replace('.','/')}?${new URLSearchParams(Object.entries(filters).filter(([,v])=>v!==''&&v!==null&&v!==undefined))}`);
};
export async function downloadReport(code,filters={}){
 const blob=await apiDownload('/reports/exports',{report_code:code,format:'csv',filters});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`edunext-${code.replace(/[^a-z0-9]/g,'-')}.csv`;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
