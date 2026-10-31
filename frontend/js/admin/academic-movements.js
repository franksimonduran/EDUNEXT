import {organizationShell,queryParams,installProposalActions,statusMessage,emptyState} from './organization-kernel.js';
import {movementList,saveMovementProposal,archiveMovementProposal,deleteMovementProposal,duplicateMovementProposal,movementOptions} from '../services/admin-academic-movements.service.js';
import {getAcademicRecord} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {movementTable,movementFilters,movementSummary} from '../components/admin-academic-movement.js';
import {orgLink,orgNote,validationPanel,esc,field,select,area} from '../components/admin-relationship-validation.js';
import {organizationModel} from '../utils/academic-relations.js';
import {prepareStaticResources} from '../offline/monitor-preparation.js';
const {root,open}=organizationShell('Movimientos Académicos','movements');
const params=queryParams(),raw=Object.fromEntries(params);
let data=null,model=null,options=null;
function toolbar(){return `<div class="directory-toolbar">${orgLink('index','Dashboard')}${orgLink('matriculas','Matrículas')}${orgLink('aulas','Aulas')}${orgLink('grados-secciones','Grados y Secciones')}<button type="button" id="prepare-movements-offline">Preparar módulo offline</button></div><p id="org-message" role="status"></p>`;}
function formMarkup(){
 return `<form class="monitor-card" id="movement-form"><h2>Preparar movimiento académico local</h2><p>Los movimientos se preparan y revisan; no se ejecutan ni modifican la relación vigente.</p><div class="form-grid">${select('movementType','Tipo de movimiento',[['','Selecciona un tipo'],...data.types.map(t=>[t.id,t.label])],'classroom')}${select('studentId','Estudiante',[['','Selecciona un estudiante'],...options.students],'')}${select('periodId','Periodo académico',[['','Selecciona un periodo'],...options.periods],'')}</div><div class="form-grid">${select('fromRoomId','Aula de origen',[['','Sin aula de origen'],...options.rooms],'')}${select('toRoomId','Aula de destino',[['','Sin aula de destino'],...options.rooms],'')}${field('proposedDate','Fecha propuesta (opcional)','','date')}</div><div class="form-grid">${select('fromGrade','Grado de origen',[['','Sin grado de origen'],...options.grades.map(g=>[g.id,g.name])],'')}${select('toGrade','Grado de destino',[['','Sin grado de destino'],...options.grades.map(g=>[g.id,g.name])],'')}</div>${area('reason','Justificación administrativa (opcional)','')}<div class="inline-actions"><button type="submit">Guardar borrador de movimiento</button><button type="reset">Limpiar formulario</button></div></form><div id="movement-validation"></div>`;
}
function view(){
 const s=data.statistics;
 root.innerHTML=`<p>Consulta los movimientos académicos propuestos localmente. Ningún movimiento se ejecuta: las promociones requieren criterios pedagógicos y autorización institucional, y los traslados corresponden al backend future.</p>${toolbar()}${movementSummary([['Movimientos locales',s.drafts],['Validación pendiente',s.incomplete],['Listos para revisión',s.ready]])}${orgNote}<form class="monitor-card" id="movement-filters">${movementFilters({types:data.types,periods:[['all','Todos (incluye sin periodo)'],['undated','Sin periodo'],...data.model.periods.map(p=>[p.id,p.name])],values:raw})}<button type="reset">Limpiar filtros</button></form><p id="movement-count" role="status"></p><div id="movement-results"></div>${formMarkup()}`;
 const form=root.querySelector('#movement-filters');
 const render=()=>{const filters=Object.fromEntries(new FormData(form));const rows=data.rows.filter(r=>(!filters.search||((r.studentAlias||'')+' '+r.originLabel+' '+r.destinationLabel).toLowerCase().includes(String(filters.search).toLowerCase()))&&(!filters.type||r.movementType===filters.type)&&(!filters.period||filters.period==='all'||filters.period==='undated'&&!r.periodId||r.periodId===filters.period)&&(!filters.state||r.state===filters.state));
  root.querySelector('#movement-count').textContent=rows.length+' movimientos locales en la selección';
  root.querySelector('#movement-results').innerHTML=rows.length?movementTable(rows):emptyState('Sin movimientos propuestos todavía.');};
 form.onsubmit=e=>e.preventDefault();form.oninput=render;form.onreset=()=>setTimeout(render,0);render();
 const movementForm=root.querySelector('#movement-form');
  movementForm.onsubmit=async e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(movementForm));try{const saved=await saveMovementProposal(payload);await refresh();root.querySelector('#movement-validation').innerHTML=validationPanel(saved.validation||{errors:[],warnings:[]},'Resultado del guardado local')+`<p>Estado local: ${esc(saved.state)} · Revisión ${saved.revision}. El movimiento no se ejecuta.</p>`;root.querySelector('#movement-validation').dataset.record=saved.id;root.querySelector('#movement-validation').dataset.marker=saved.id+':'+saved.revision;movementForm.reset();}catch(error){root.querySelector('#movement-validation').innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo guardar</h2><p>${esc(error.message)}</p></section>`;}};
}
async function load(){model=await organizationModel();options=movementOptions(model);data=await movementList(raw);}
async function refresh(){await load();view();}
installProposalActions({root,open,refresh,load:async id=>{const record=await getAcademicRecord(id);return record&&record.type==='movement'?record:null;},handlers:{
 detail:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Propuesta local de movimiento',`<p>${esc(record.data?.movementType||'')}</p>${validationPanel(result)}`);},
 validate:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Validación local de la propuesta',validationPanel(result));},
 copy:async(record,{refresh})=>{await duplicateMovementProposal(record);await refresh();statusMessage(root,'Movimiento duplicado como nueva propuesta local.');},
 archive:async(record,{refresh})=>{if(confirm('¿Archivar esta propuesta local de movimiento?')){await archiveMovementProposal(record);await refresh();statusMessage(root,'Propuesta archivada localmente.');}},
 delete:async(record,{refresh})=>{if(confirm('¿Eliminar esta propuesta local de movimiento?')){await deleteMovementProposal(record);await refresh();statusMessage(root,'Propuesta eliminada del dispositivo.');}}
}});
document.addEventListener('click',async e=>{const b=e.target.closest('#prepare-movements-offline');if(!b)return;b.disabled=true;try{const base=new URL('../../',import.meta.url),files=await prepareStaticResources(['movimientos-academicos','matriculas','aulas','grados-secciones','periodos-academicos'].map(p=>new URL('admin/'+p+'.html',base).href),n=>statusMessage(root,n+' archivos preparados…'));statusMessage(root,'Módulo preparado offline: '+files.length+' archivos verificados en este dispositivo. Sin envío a servidor.');}catch(error){statusMessage(root,error.message);}finally{b.disabled=false;}});
try{await load();view();}catch(error){root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo cargar los movimientos</h2><p>${esc(error.message)}</p>${orgLink('index','Volver al panel')}</section>`;}finally{root.setAttribute('aria-busy','false');}
