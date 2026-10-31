import {organizationShell,queryValue,createGuard,installUnsavedGuard,formatDate} from './organization-kernel.js';
import {saveAssignmentProposal,assignmentDetail,assignmentOptions} from '../services/admin-teacher-assignments.service.js';
import {getAcademicRecord} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {organizationModel} from '../utils/academic-relations.js';
import {responsibilityOptions} from '../components/admin-teacher-assignment.js';
import {orgLink,orgNote,validationPanel,esc,field,select,area} from '../components/admin-relationship-validation.js';
const {root,open}=organizationShell('Preparar Asignación Docente','assignments');
const guard=createGuard();installUnsavedGuard(guard);
const id=queryValue('id');
const presetMonitor=queryValue('docente'),presetRoom=queryValue('aula');
let model=null,record=null,options=null,currentId=id;
function formMarkup(values){
  const monitors=options&&options.monitors?options.monitors:[];
  const rooms=options&&options.rooms?options.rooms:[];
  const courses=options&&options.courses?options.courses:[];
  const periods=options&&options.periods?options.periods:[];
  return `<form class="monitor-card" id="assignment-form"><h2>${id?'Editar propuesta de asignación':'Nueva propuesta local de asignación docente'}</h2><div class="form-grid">${select('monitorId','Monitor/Docente',[['','Selecciona un monitor'],...monitors],values.monitorId||presetMonitor||'')}${select('roomId','Aula',[['','Selecciona un aula'],...rooms],values.roomId||presetRoom||'')}${select('courseKey','Asignatura',[['','Selecciona una asignatura'],...courses],values.courseKey||'')}${select('periodId','Periodo académico',[['','Selecciona un periodo'],...periods],values.periodId||'')}${field('responsibility','Responsabilidad (opcional)',values.responsibility||'','text','maxlength="120"')}</div>${area('notes','Observaciones administrativas (opcional)',values.notes||'')}<div class="inline-actions"><button type="submit">Guardar borrador</button><button type="button" id="save-ready">Guardar y marcar listo para revisión local</button><button type="button" id="validate-draft">Validar</button><button type="reset">Limpiar formulario</button></div></form><div id="assignment-validation"></div>`;
}
async function persist(ready){
 const form=root.querySelector('#assignment-form'),data=Object.fromEntries(new FormData(form));
 try{const saved=await saveAssignmentProposal(data,currentId||null,{ready});record=saved;guard.clear();root.querySelector('#assignment-validation').innerHTML=validationPanel(saved.validation||{errors:[],warnings:[]},'Resultado del guardado local')+`<p>Estado local: ${esc(saved.state)} · Revisión ${saved.revision} · ${esc(formatDate(saved.updatedAt))}</p><p>La propuesta no concede acceso al docente ni modifica sus cursos oficiales.</p>`;root.querySelector('#assignment-validation').dataset.record=saved.id;root.querySelector('#assignment-validation').dataset.marker=saved.id+':'+saved.revision;if(!currentId){currentId=saved.id;history.replaceState(null,'','editar-asignacion.html?id='+encodeURIComponent(saved.id));}}
 catch(error){root.querySelector('#assignment-validation').innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo guardar</h2><p>${esc(error.message)}</p></section>`;}
}
async function load(){
 model=await organizationModel();
  options=Object.fromEntries(Object.entries(assignmentOptions(model)).map(([key,values])=>[key,values.map(o=>[o.id,o.label])]));
 if(id){const data=await assignmentDetail(id);record=data?.record||null;}
 const values=record?.data||{};
 root.innerHTML=`<div class="directory-toolbar">${orgLink('asignaciones-docentes','Volver a asignaciones')}${orgLink('index','Dashboard')}</div>${orgNote}<p class="demo-label">Borrador local · Sin efectos institucionales · Alias y códigos ficticios</p>${formMarkup(values)}${record?`<section class="monitor-card"><h2>Propuesta actual</h2><p>${esc(record.id)} · Estado ${esc(record.state)} · Revisión ${record.revision} · ${esc(formatDate(record.updatedAt))}</p></section>`:''}`;
  const form=root.querySelector('#assignment-form');
  form.onsubmit=async e=>{e.preventDefault();await persist(false);};
  form.oninput=()=>guard.set();
  if(form.elements.monitorId)form.elements.monitorId.value=values.monitorId||presetMonitor||'';
  if(form.elements.roomId)form.elements.roomId.value=values.roomId||presetRoom||'';
  if(form.elements.courseKey)form.elements.courseKey.value=values.courseKey||'';
  if(form.elements.periodId)form.elements.periodId.value=values.periodId||'';
  if(form.elements.responsibility)form.elements.responsibility.value=values.responsibility||'';
  if(form.elements.notes)form.elements.notes.value=values.notes||'';
  root.querySelector('#save-ready').onclick=async()=>persist(true);
  root.querySelector('#validate-draft').onclick=async()=>{const draft=record?{...record,data:{...record.data,...Object.fromEntries(new FormData(form))}}:{id:'preview',type:'assignment',owner:'demo-admin',institutionId:'demo-institution',state:'draft',revision:0,version:0,data:Object.fromEntries(new FormData(form))};const result=await validateOrganizationRecord(draft);root.querySelector('#assignment-validation').innerHTML=validationPanel(result);};
}
try{await load();}catch(error){root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo abrir el editor</h2><p>${esc(error.message)}</p>${orgLink('asignaciones-docentes','Volver a asignaciones')}</section>`;}finally{root.setAttribute('aria-busy','false');}
