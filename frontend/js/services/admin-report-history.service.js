import {listReportConfigs,listReportHistory} from './admin-reports.service.js';
import {demoInstitution} from '../data/admin-demo.data.js';

export async function getReportHistory(filters={}){
  const configs=await listReportConfigs();
  const history=await listReportHistory();
  
  const configItems=configs.map(c=>({...c,source:'config',displayName:c.name||`Configuración ${c.type}`}));
  const historyItems=history.map(h=>({...h,source:'history',displayName:h.name||`Historial ${h.type||h.config?.type||'desconocido'}`}));
  
  let items=[...configItems,...historyItems].sort((a,b)=>Date.parse(b.updatedAt||b.createdAt)-Date.parse(a.updatedAt||a.createdAt));
  
  if(filters.type)items=items.filter(i=>i.type===filters.type);
  if(filters.source)items=items.filter(i=>i.source===filters.source);
  if(filters.dateFrom)items=items.filter(i=>i.updatedAt&&new Date(i.updatedAt)>=new Date(filters.dateFrom)||i.createdAt&&new Date(i.createdAt)>=new Date(filters.dateFrom));
  if(filters.dateTo)items=items.filter(i=>i.updatedAt&&new Date(i.updatedAt)<=new Date(filters.dateTo)||i.createdAt&&new Date(i.createdAt)<=new Date(filters.dateTo));
  if(filters.q){const q=filters.q.toLowerCase();items=items.filter(i=>i.displayName.toLowerCase().includes(q));}
  
  return {
    institution:demoInstitution,
    filters,
    generatedAt:new Date().toISOString(),
    total:items.length,
    items,
    methodology:'Configuraciones e historial guardados localmente en este dispositivo. No constituyen archivo institucional.',
    limitations:['Solo almacenamiento local','Sin sincronización entre dispositivos','Sin respaldo en servidor']
  };
}

export async function saveReportToHistory(config,reportData){
  const entry={
    configId:config.id,
    type:config.type,
    name:config.name||`${config.type} ${new Date().toLocaleDateString('es')}`,
    filters:{period:config.period,grade:config.grade,room:config.room,course:config.course,indicators:config.indicators},
    options:{showTables:config.showTables,showCharts:config.showCharts,showMethodology:config.showMethodology,showWarnings:config.showWarnings},
    generatedAt:new Date().toISOString(),
    dataSummary:reportData?{keys:Object.keys(reportData),generatedAt:reportData.generatedAt}:null
  };
  return {id:'hist-'+crypto.randomUUID(),...entry,createdAt:new Date().toISOString()};
}