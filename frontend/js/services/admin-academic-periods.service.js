import {organizationModel,periodById} from '../utils/academic-relations.js';
import {listAcademicRecords,newAcademicRecord,saveAcademicRecord,archiveAcademicRecord,deleteAcademicRecord,getAcademicRecord} from './admin-organization-drafts.service.js';
import {validatePeriodDraft} from '../utils/period-validation.js';
import {basePeriods,periodTypeLabel,periodTypeIds,periodsOfYear,academicYears,periodLabel} from '../data/admin-academic-periods-demo.data.js';
export async function periodList(filters={}){
 const model=await organizationModel();const records=await listAcademicRecords('period');
 const base=model.periods.map(p=>({id:p.id,name:p.name,year:p.year,type:p.type||'semester',typeLabel:periodTypeLabel(p.type||'semester'),start:p.start,end:p.end,state:'base-demo',kind:'base',source:'Periodo de la configuración base de demostración'}));
 const drafts=records.filter(r=>r.state!=='archived').map(r=>({id:r.id,name:r.data?.name||'Periodo propuesto',year:Number(r.data?.year)||null,type:r.data?.type||'semester',typeLabel:periodTypeLabel(r.data?.type||'semester'),start:r.data?.start||null,end:r.data?.end||null,state:r.state,kind:'draft',source:'Propuesta local de configuración',updatedAt:r.updatedAt}));
 const rows=[...base,...drafts].filter(r=>(!filters.year||Number(r.year)===Number(filters.year))&&(!filters.type||r.type===filters.type)&&(!filters.search||String(r.name).toLowerCase().includes(String(filters.search).toLowerCase())));
 return {periods:rows,years:academicYears,types:periodTypeIds.map(id=>({id,label:periodTypeLabel(id)})),model,records};
}
export async function periodDetail(id){const model=await organizationModel();const records=await listAcademicRecords('period');const base=periodById(model,id);const record=await getAcademicRecord(id);if(!base&&!record)return null;return {period:base?{...base,kind:'base',typeLabel:periodTypeLabel(base.type||'semester')}:{id:record.id,...record.data,kind:'draft',state:record.state},model,records,record};}
export async function savePeriodProposal(data,id=null,{ready=false}={}){const model=await organizationModel();const records=await listAcademicRecords('period');const record=id?await getAcademicRecord(id):newAcademicRecord('period',data);if(!record)throw new Error('La propuesta de periodo ya no existe.');const merged={...record,data:{...record.data,...data}};return saveAcademicRecord(merged,{allowIncomplete:true,ready,validator:(candidate,all)=>validatePeriodDraft(candidate,model,all)});}
export async function archivePeriodProposal(record){return archiveAcademicRecord(record);}
export async function deletePeriodProposal(record){const records=await listAcademicRecords();const dependencies=records.filter(r=>r.id!==record.id&&r.state!=='archived'&&r.data?.periodId===record.id);return deleteAcademicRecord(record,{dependencies});}
export const periodReference=(id)=>periodLabel(id);
export const periodsByYear=(year)=>periodsOfYear(basePeriods,year);
