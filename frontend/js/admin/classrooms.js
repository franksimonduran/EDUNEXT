import {organizationShell,queryParams,installProposalActions,emptyState,statusMessage} from './organization-kernel.js';
import {classroomList,archiveClassroomProposal,deleteClassroomProposal,duplicateClassroomProposal} from '../services/admin-classrooms.service.js';
import {getAcademicRecord} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {classroomTable,classroomCards,classroomFilters,classroomSummary} from '../components/admin-classroom-card.js';
import {orgLink,orgNote,orgSummary,validationPanel,esc,proposalActions} from '../components/admin-relationship-validation.js';
import {prepareStaticResources} from '../offline/monitor-preparation.js';
const {root,open}=organizationShell('Gestión de Aulas','rooms');
const params=queryParams(),raw=Object.fromEntries(params);
let data=null,page=1;
const grades=()=>data.model.grades.map(g=>({id:g.id,name:g.name}));
const sections=()=>[...new Set(data.model.rooms.map(r=>r.section))].sort();
const periods=()=>[['all','Todos (incluye sin periodo)'],['undated','Sin periodo confirmado'],...data.model.periods.map(p=>[p.id,p.name])];
const monitors=()=>data.model.monitors.map(m=>({id:m.id,alias:m.alias}));
function toolbar(){return `<div class="directory-toolbar">${orgLink('index','Dashboard')}${orgLink('grados-secciones','Grados y Secciones')}${orgLink('matriculas','Matrículas')}${orgLink('asignaciones-docentes','Asignaciones Docentes')}${orgLink('periodos-academicos','Periodos Académicos')}${orgLink('movimientos-academicos','Movimientos Académicos')}${orgLink('editar-aula','+ Preparar aula')}<button type="button" id="prepare-classrooms-offline">Preparar módulo offline</button></div><p id="org-message" role="status"></p>`;}
function summary(){const s=data.statistics;return orgSummary([['Aulas registradas',s.classrooms],['Estudiantes relacionados',s.students],['Aulas con docente',s.withTeacher],['Aulas sin docente',s.withoutTeacher],['Borradores locales',s.drafts],['Validación pendiente',s.incomplete]])+`<p>Capacidades referenciales: solo el aula de 5.º lleva un valor de demostración (${data.model.rooms.filter(r=>r.capacity).map(r=>r.code+': '+r.capacity).join(', ')||'ninguna'}). El resto no tiene capacidad configurada y no se inventa ninguna.</p>`;}
function view(){root.innerHTML=`<p>Consulta las aulas de la institución y prepara propuestas locales de asignación docente y matrícula. Ninguna propuesta crea ni modifica un aula oficial.</p>${toolbar()}${summary()}${orgNote}<form class="monitor-card" id="classroom-filters">${classroomFilters({grades:grades(),periods:periods(),sections:sections(),monitors:monitors(),values:raw})}<button type="reset">Limpiar filtros</button></form><p id="classroom-count" role="status"></p><div id="classroom-results"></div>`;
 const form=root.querySelector('#classroom-filters');
 const render=()=>{const filters=Object.fromEntries(new FormData(form));const scope=data.rows.filter(r=>filters.state==='archived'?r.state==='archived':r.state!=='archived');const rows=scope.filter(row=>(!filters.search||(row.code+' '+(row.name||'')+' '+row.section).toLowerCase().includes(String(filters.search).toLowerCase()))&&(!filters.grade||Number(row.grade)===Number(filters.grade))&&(!filters.section||row.section===filters.section)&&(!filters.period||filters.period==='all'||filters.period==='undated'&&!row.periodId||row.periodId===filters.period)&&(!filters.monitor||(row.monitorIds||[]).includes(filters.monitor))&&(!filters.state||filters.state==='base'&&row.kind==='base'||filters.state==='draft'&&row.kind==='draft'||filters.state==='incomplete'&&row.state==='incomplete'||filters.state==='archived'));
  root.querySelector('#classroom-count').textContent=rows.length+' aulas en la selección · '+rows.filter(r=>r.kind==='base').length+' registradas · '+rows.filter(r=>r.kind==='draft').length+' borradores locales';
  root.querySelector('#classroom-results').innerHTML=rows.length?classroomTable(rows)+classroomCards(rows):emptyState();};
 form.onsubmit=e=>e.preventDefault();form.oninput=render;form.onreset=()=>setTimeout(render,0);render();}
async function load(){data=await classroomList(raw);}
async function refresh(){await load();view();}
installProposalActions({root,open,refresh,load:async id=>{const record=await getAcademicRecord(id);return record&&record.type==='classroom'?record:null;},handlers:{
 detail:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Borrador de aula — propuesta local',`<p>${esc(record.data?.code||'')} · ${esc(record.data?.name||'Sin nombre')}</p>${validationPanel(result)}`);},
 validate:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Validación local del borrador',validationPanel(result));},
 copy:async(record,{refresh})=>{await duplicateClassroomProposal(record);await refresh();statusMessage(root,'Borrador duplicado como nueva propuesta local.');},
 archive:async(record,{refresh})=>{if(confirm('¿Archivar este borrador local de aula? Se conservará en el historial local.')){await archiveClassroomProposal(record);await refresh();statusMessage(root,'Borrador archivado localmente.');}},
 delete:async(record,{refresh})=>{if(confirm('¿Eliminar este borrador local de aula? No se borrarán datos base de la institución.')){await deleteClassroomProposal(record);await refresh();statusMessage(root,'Borrador eliminado del dispositivo.');}}
}});
document.addEventListener('click',async e=>{const b=e.target.closest('#prepare-classrooms-offline');if(!b)return;b.disabled=true;try{const base=new URL('../../',import.meta.url),files=await prepareStaticResources(['aulas','aula-detalle','editar-aula','grados-secciones','periodos-academicos','matriculas','editar-matricula','asignaciones-docentes','editar-asignacion','movimientos-academicos'].map(p=>new URL('admin/'+p+'.html',base).href),n=>statusMessage(root,n+' archivos preparados…'));statusMessage(root,'Módulo preparado offline: '+files.length+' archivos verificados en este dispositivo. Sin envío a servidor.');}catch(error){statusMessage(root,error.message);}finally{b.disabled=false;}});
try{await load();view();}catch(error){root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo cargar la información de aulas</h2><p>${esc(error.message)}</p>${orgLink('index','Volver al panel')}</section>`;}finally{root.setAttribute('aria-busy','false');}
