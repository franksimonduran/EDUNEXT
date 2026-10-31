import {organizationShell,queryParams,installProposalActions,statusMessage,emptyState} from './organization-kernel.js';
import {assignmentList,archiveAssignmentProposal,deleteAssignmentProposal,duplicateAssignmentProposal} from '../services/admin-teacher-assignments.service.js';
import {getAcademicRecord} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {assignmentTable,assignmentFilters,assignmentSummary,responsibilityOptions} from '../components/admin-teacher-assignment.js';
import {orgLink,orgNote,validationPanel,esc} from '../components/admin-relationship-validation.js';
import {prepareStaticResources} from '../offline/monitor-preparation.js';
const {root,open}=organizationShell('Asignaciones Docentes','assignments');
const params=queryParams(),raw=Object.fromEntries(params);
let data=null;
function toolbar(){return `<div class="directory-toolbar">${orgLink('index','Dashboard')}${orgLink('aulas','Aulas')}${orgLink('grados-secciones','Grados y Secciones')}${orgLink('matriculas','Matrículas')}${orgLink('editar-asignacion','+ Preparar asignación')}<button type="button" id="prepare-assignments-offline">Preparar módulo offline</button></div><p id="org-message" role="status"></p>`;}
function view(){
 const s=data.statistics;
 root.innerHTML=`<p>Consulta las asignaciones docentes de la demostración y prepara propuestas locales. Ninguna propuesta concede acceso, cambia permisos ni modifica los cursos del docente.</p>${toolbar()}${assignmentSummary([['Asignaciones base',s.assignments],['Docentes relacionados',s.monitors],['Aulas con docente',s.roomsWithTeacher],['Propuestas locales',s.drafts],['Validación pendiente',s.incomplete]])}${orgNote}<form class="monitor-card" id="assignment-filters">${assignmentFilters({monitors:data.model.monitors.map(m=>({id:m.id,alias:m.alias})),rooms:data.model.rooms.map(r=>({id:r.id,label:`${r.code} · ${r.gradeName} ${r.section}`})),courses:data.model.courses.map(c=>({id:c.key,label:c.name})),periods:[['all','Todos (incluye sin periodo)'],['undated','Sin periodo confirmado'],...data.model.periods.map(p=>[p.id,p.name])],grades:data.model.grades.map(g=>({id:g.id,name:g.name})),values:raw})}<button type="reset">Limpiar filtros</button></form><p id="assignment-count" role="status"></p><div id="assignment-results"></div>`;
 const form=root.querySelector('#assignment-filters');
  const render=()=>{const filters=Object.fromEntries(new FormData(form));const scope=data.rows.filter(r=>filters.state==='archived'?r.state==='archived':r.state!=='archived');const rows=scope.filter(r=>(!filters.search||((r.monitorAlias||'')+' '+(r.monitorCode||'')+' '+r.courseName).toLowerCase().includes(String(filters.search).toLowerCase()))&&(!filters.grade||Number(r.grade)===Number(filters.grade))&&(!filters.room||r.roomId===filters.room)&&(!filters.course||r.courseKey===filters.course)&&(!filters.period||filters.period==='all'||filters.period==='undated'&&!r.periodId||r.periodId===filters.period)&&(!filters.state||(filters.state==='base-demo'?r.kind==='base':r.state===filters.state)));
  root.querySelector('#assignment-count').textContent=rows.length+' asignaciones en la selección · '+rows.filter(r=>r.kind==='base').length+' base · '+rows.filter(r=>r.kind==='draft').length+' propuestas locales';
  root.querySelector('#assignment-results').innerHTML=rows.length?assignmentTable(rows):emptyState();};
 form.onsubmit=e=>e.preventDefault();form.oninput=render;form.onreset=()=>setTimeout(render,0);render();
}
async function load(){data=await assignmentList(raw);}
async function refresh(){await load();view();}
installProposalActions({root,open,refresh,load:async id=>{const record=await getAcademicRecord(id);return record&&record.type==='assignment'?record:null;},handlers:{
 detail:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Propuesta local de asignación docente',`<p>${esc(record.data?.monitorId||'')}</p>${validationPanel(result)}`);},
 validate:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Validación local de la propuesta',validationPanel(result));},
 copy:async(record,{refresh})=>{await duplicateAssignmentProposal(record);await refresh();statusMessage(root,'Propuesta duplicada como nueva asignación local.');},
 archive:async(record,{refresh})=>{if(confirm('¿Archivar esta propuesta local de asignación?')){await archiveAssignmentProposal(record);await refresh();statusMessage(root,'Propuesta archivada localmente.');}},
 delete:async(record,{refresh})=>{if(confirm('¿Eliminar esta propuesta local de asignación?')){await deleteAssignmentProposal(record);await refresh();statusMessage(root,'Propuesta eliminada del dispositivo.');}}
}});
document.addEventListener('click',async e=>{const b=e.target.closest('#prepare-assignments-offline');if(!b)return;b.disabled=true;try{const base=new URL('../../',import.meta.url),files=await prepareStaticResources(['asignaciones-docentes','editar-asignacion','aulas','grados-secciones','periodos-academicos'].map(p=>new URL('admin/'+p+'.html',base).href),n=>statusMessage(root,n+' archivos preparados…'));statusMessage(root,'Módulo preparado offline: '+files.length+' archivos verificados en este dispositivo. Sin envío a servidor.');}catch(error){statusMessage(root,error.message);}finally{b.disabled=false;}});
try{await load();view();}catch(error){root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo cargar la información de asignaciones</h2><p>${esc(error.message)}</p>${orgLink('index','Volver al panel')}</section>`;}finally{root.setAttribute('aria-busy','false');}
