import {validCivil,formatCivil} from './calendar-dates.js';
import {periodTypeIds,periodTypeLabel,periodOverlaps} from '../data/admin-academic-periods-demo.data.js';
const text=(value,max)=>typeof value==='string'&&value.length<=max&&!/<\/?[a-z][^>]*>|javascript\s*:/i.test(value);
export function validatePeriodDraft(record,model,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=record.data||{};
 if(!d.name||!text(d.name,80))add('name','Indica un nombre de periodo de hasta 80 caracteres.',true);
 if(!/^\d{4}$/.test(String(d.year||''))||Number(d.year)<2000||Number(d.year)>2100)add('year','Indica un año de cuatro cifras coherente con la demostración.',true);
 if(!periodTypeIds.includes(d.type))add('type','Selecciona un tipo de periodo compatible con la configuración.',true);
 if(d.start&&!validCivil(d.start))add('start','La fecha de inicio no es una fecha civil válida.',true);
 if(d.end&&!validCivil(d.end))add('end','La fecha de fin no es una fecha civil válida.',true);
 if(d.start&&d.end&&validCivil(d.start)&&validCivil(d.end)&&d.start>=d.end)add('end','La fecha de inicio debe ser anterior a la fecha de fin.',true);
 if(d.start&&d.year&&validCivil(d.start)&&!String(d.start).startsWith(String(d.year)))warnings.push('La fecha de inicio no pertenece al año indicado; revisa la configuración.');
 if(d.end&&d.year&&validCivil(d.end)&&!String(d.end).startsWith(String(d.year)))warnings.push('La fecha de fin no pertenece al año indicado; revisa la configuración.');
 if(d.start&&d.end&&model.periods.some(p=>periodOverlaps(p,{start:d.start,end:d.end})))warnings.push('El intervalo se solapa con un periodo ya configurado. Los solapamientos dependen de reglas institucionales que el backend validará.');
 const duplicate=records.filter(r=>r.type==='period'&&r.id!==record.id&&r.state!=='archived'&&String(r.data?.name||'').toLowerCase()===String(d.name||'').toLowerCase()&&String(r.data?.year)===String(d.year)&&r.data?.type===d.type);
 if(duplicate.length)add('name','Ya existe una propuesta de periodo con el mismo nombre, año y tipo.',true);
 if(d.description&&!text(d.description,400))add('description','La descripción debe ser texto seguro de hasta 400 caracteres.',true);
 warnings.push('El periodo se guarda como configuración de demostración: no activa ni cierra periodos oficiales.');
 return {errors,warnings,valid:!errors.length,checkedAt:new Date().toISOString()};
}
export const periodDateLabel=day=>validCivil(day)?formatCivil(day,{dateStyle:'long'}):'Sin fecha disponible';
export const periodTypeText=id=>periodTypeLabel(id);
