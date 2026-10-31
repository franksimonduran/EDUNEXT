import {academicPeriods} from './monitor-academic-periods.data.js';
export const periodTypes=Object.freeze({
 year:'Año académico',
 semester:'Semestre',
 bimester:'Bimestre',
 trimester:'Trimestre',
 custom:'Periodo personalizado'
});
export const periodTypeIds=Object.freeze(Object.keys(periodTypes));
export const periodTypeLabel=id=>periodTypes[id]||'Tipo no configurado';
const typeByLabel=p=>/semestre/i.test(p.label)?'semester':/bimestre/i.test(p.label)?'bimester':/trimestre/i.test(p.label)?'trimester':/año/i.test(p.label)?'year':'custom';
export const basePeriods=Object.freeze(academicPeriods.map(p=>Object.freeze({...p,type:typeByLabel(p),state:'base-demo',institutionId:'demo-institution',source:'Periodo de demostración · No oficial'})));
export const periodById=id=>basePeriods.find(p=>p.id===id)||null;
export const periodLabel=id=>periodById(id)?.label||'Periodo no configurado';
export const periodsOfYear=year=>basePeriods.filter(p=>String(p.id).startsWith(String(year)));
export const academicYears=Object.freeze([...new Set(basePeriods.map(p=>String(p.id).slice(0,4)))]);
export const periodOverlaps=(a,b)=>Boolean(a.start&&b.start&&a.end&&b.end)&&a.start<=b.end&&b.start<=a.end;
