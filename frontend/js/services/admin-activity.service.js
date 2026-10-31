import {dateInPeriod} from './monitor-grades.service.js';
export function administrativeActivity({content=[],evaluations=[],activities=[]},period='all'){
 const rows=[...content.map(d=>({id:'content:'+d.id,type:'Contenido',description:'Borrador local: '+d.title,date:d.date,state:d.state,source:'Borrador local'})),...evaluations.map(e=>({id:'evaluation:'+e.id,type:'Evaluación',description:e.title,date:e.updatedAt||e.createdAt||null,state:e.state,source:'Evaluación local de demostración'})),...activities.map(a=>({id:'activity:'+a.id,type:a.kind==='task'?'Tarea':'Refuerzo',description:a.title,date:a.updatedAt||a.createdAt||null,state:a.state,source:'Actividad local'}))];
 return rows.filter(r=>r.date&&Number.isFinite(Date.parse(r.date))&&dateInPeriod(r.date,period)).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,8);
}
export function administrativeAlerts({content,sourceErrors=[],resourceCheck=null}){
 const alerts=[{id:'integration',priority:'info',title:'Servicio pendiente de integración',message:'FastAPI, PostgreSQL, EDUNEXT AI y EDUNEXT Sync no están conectados; no es una emergencia operativa.'}];
 if(content?.ready.length)alerts.push({id:'local-review',priority:'review',title:'Propuestas locales listas para revisar',message:content.ready.length+' borradores en estado ready; no son solicitudes institucionales ni contenido aprobado.'});
 if(content?.errors.length)alerts.push({id:'validation',priority:'error',title:'Errores técnicos detectados',message:content.errors.length+' borradores no superan la validación actual. El detalle identifica sus referencias y errores.'});
 for(const [i,error] of sourceErrors.entries())alerts.push({id:'source-'+i,priority:'error',title:'Fuente local no disponible',message:error});
 if(resourceCheck?.missing.length)alerts.push({id:'resource-missing',priority:'review',title:navigator.onLine?'Recursos no disponibles en la comprobación':'Recursos no preparados offline',message:resourceCheck.missing.length+' referencias no disponibles en la comprobación del dispositivo actual.'});
 return alerts;
}
