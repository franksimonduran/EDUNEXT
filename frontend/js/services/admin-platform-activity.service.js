import {listAcademicRecords} from './admin-organization-drafts.service.js';
import {loadAcademicData,dateInPeriod} from './monitor-grades.service.js';
import {demoInstitution} from '../data/admin-demo.data.js';

const activityTypeMap=Object.freeze({
  classroom:'draft_created',
  section:'draft_created',
  period:'draft_created',
  enrollment:'proposal_created',
  assignment:'proposal_created',
  movement:'proposal_created',
  classroom_draft:'draft_created',
  classroom_review:'review_completed',
  enrollment_review:'review_completed',
  assignment_review:'review_completed',
  movement_review:'review_completed'
});

export async function getPlatformActivity(filters={}){
  const records=await listAcademicRecords();
  const academicData=await loadAcademicData();
  
  let events=records
    .filter(r=>dateInPeriod(r.updatedAt||r.createdAt||null,filters.period))
    .map(r=>({
      id:r.id,
      type:activityTypeMap[r.type]||'config_modified',
      typeLabel:activityTypeMap[r.type]?activityTypeMap[r.type].replace('_',' '):'Configuración local modificada',
      state:r.state,
      revision:r.revision,
      version:r.version,
      date:r.updatedAt||r.createdAt,
      owner:r.owner,
      institutionId:r.institutionId,
      summary:`${r.type} · ${r.state} · Rev ${r.revision}`
    }));
  
  const attempts=academicData.rows.filter(r=>dateInPeriod(r.date,filters.period));
  events=events.concat(attempts.map(a=>({
    id:`attempt-${a.id}`,
    type:'evaluation_registered',
    typeLabel:'Evaluación registrada en demostración',
    state:a.status,
    date:a.date,
    owner:'demo-monitor',
    institutionId:'demo-institution',
    summary:`Evaluación ${a.title} · ${a.status} · ${a.grade}º`
  })));
  
  if(filters.type)events=events.filter(e=>e.type===filters.type);
  if(filters.typeLabel)events=events.filter(e=>e.typeLabel===filters.typeLabel);
  if(filters.state)events=events.filter(e=>e.state===filters.state);
  if(filters.owner)events=events.filter(e=>e.owner===filters.owner);
  if(filters.dateFrom)events=events.filter(e=>e.date&&new Date(e.date)>=new Date(filters.dateFrom));
  if(filters.dateTo)events=events.filter(e=>e.date&&new Date(e.date)<=new Date(filters.dateTo));
  
  events.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  
  return {
    institution:demoInstitution,
    filters,
    generatedAt:new Date().toISOString(),
    total:events.length,
    events:events.slice(0,200),
    byType:Object.entries(events.reduce((acc,e)=>{acc[e.type]=(acc[e.type]||0)+1;return acc;},{})).map(([type,count])=>({type,count})),
    methodology:'Registros locales de demostración; no incluyen actividad remota.',
    limitations:['Solo dispositivo actual','Sin eventos de autenticación','Sin telemetría de estudiantes','Sin eventos de servidor']
  };
}

export async function getActivityStats(filters={}){
  const activity=await getPlatformActivity(filters);
  return {
    total:activity.total,
    byType:activity.byType,
    byState:activity.events.reduce((acc,e)=>{acc[e.state]=(acc[e.state]||0)+1;return acc;},{}),
    byOwner:activity.events.reduce((acc,e)=>{acc[e.owner]=(acc[e.owner]||0)+1;return acc;},{}),
    dateRange:activity.events.length?{earliest:activity.events[activity.events.length-1]?.date,latest:activity.events[0]?.date}:null
  };
}