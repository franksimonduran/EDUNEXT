import {managementShell} from './management-shell.js';
import {loadAcademicData,defaultFilters,validateAcademicFilters} from '../services/monitor-grades.service.js';
import {authorizedRooms,getStudent} from '../services/monitor-students.service.js';
import {gradesView,gradebookView,gradeDetailView,historyView,analysisView} from './gradebook.js';
import {reportCenterView,reportView} from './academic-reports.js';
import {errorState} from '../components/monitor-academic-ui.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {renderReportsApi} from '../components/reports-api-view.js';
const view=document.body.dataset.view;
const titles={grades:'Notas y Calificaciones',gradebook:'Registro Académico',detail:'Detalle de Calificación',history:'Historial Académico',analysis:'Análisis de Resultados',reports:'Reportes Académicos',classReport:'Reporte Académico del Aula',studentReport:'Informe Académico Individual'};
const shell=managementShell(titles[view],['reports','classReport','studentReport'].includes(view)?'reports':'grades');
const params=new URLSearchParams(location.search),raw=Object.fromEntries(params),filters={...defaultFilters,...raw};
if(view==='history'){filters.student=raw.student||raw.id||'';const student=getStudent(filters.student);if(!params.has('room')&&student)filters.room=student.classroomId;}
if(view==='gradebook'&&!params.has('room'))filters.room=authorizedRooms()[0]?.id||'all';
if(view==='gradebook'&&!params.has('course'))filters.course='Matemática';
try{
 if(useProgressApi()&&['reports','classReport','studentReport'].includes(view)){
  renderReportsApi(shell.root,'monitor');
 }else{
 let data=await loadAcademicData();
 const errors=validateAcademicFilters(filters,data);
 if([...params.keys()].some(key=>params.getAll(key).length>1))errors.push('Hay parámetros repetidos. Abre un enlace válido desde el listado.');
 if(view==='history'&&!getStudent(filters.student))errors.push('Estudiante inexistente o no disponible.');
 if(errors.length)shell.root.innerHTML=errorState(errors);
 else {
  const views={grades:gradesView,gradebook:gradebookView,detail:gradeDetailView,history:historyView,analysis:analysisView,reports:reportCenterView,classReport:reportView,studentReport:reportView};
  const render=async()=>{data=await loadAcademicData();await views[view]({...shell,data,filters,raw,view});};
  await render();
  // Re-read the shared corrections after returning from a grading tab; no cached grade copies.
  window.addEventListener('pageshow',event=>{if(event.persisted)render().catch(()=>{});});
  window.addEventListener('focus',()=>document.dispatchEvent(new Event('academic-data-refresh')));
  if(view==='detail')document.addEventListener('academic-data-refresh',()=>render().catch(()=>{shell.root.innerHTML=errorState(['No se pudo actualizar el detalle desde la corrección local.']);}));
 }
 }
}catch(error){shell.root.innerHTML=errorState(['No se pudieron consultar los datos locales. Comprueba el almacenamiento y vuelve a intentarlo.']);const retry=document.createElement('button');retry.textContent='Reintentar consulta';retry.onclick=()=>location.reload();shell.root.append(retry);}
