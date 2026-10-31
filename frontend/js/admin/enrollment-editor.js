import {organizationShell,queryValue,createGuard,installUnsavedGuard,formatDate,queryParams} from './organization-kernel.js';
import {saveEnrollmentProposal,enrollmentDetail,enrollmentOptions} from '../services/admin-enrollments.service.js';
import {getAcademicRecord,listAcademicRecords} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {organizationModel,enrollmentsOfStudent} from '../utils/academic-relations.js';
import {enrollmentDuplicates} from '../utils/enrollment-duplicates.js';
import {orgLink,orgNote,validationPanel,esc,field,select,area} from '../components/admin-relationship-validation.js';
import {duplicateNotice} from '../components/admin-enrollment-table.js';
const {root,open}=organizationShell('Preparar Matrícula','enrollments');
const guard=createGuard();installUnsavedGuard(guard);
const id=queryValue('id');
const presetRoom=queryValue('aula'),presetStudent=queryValue('estudiante');
let model=null,record=null,options=null,currentId=id;
function formMarkup(values){
  const students=options&&options.students?options.students:[];
  const rooms=options&&options.rooms?options.rooms:[];
  const periods=options&&options.periods?options.periods:[];
  return `<form class="monitor-card" id="enrollment-form"><h2>${id?'Editar propuesta de matrícula':'Nueva propuesta local de matrícula'}</h2><div class="form-grid">${select('studentId','Estudiante',[['','Selecciona un estudiante'],...students],values.studentId||presetStudent||'')}${select('roomId','Aula',[['','Selecciona un aula'],...rooms],values.roomId||presetRoom||'')}${select('periodId','Periodo académico',[['','Selecciona un periodo'],...periods],values.periodId||'')}${field('proposedDate','Fecha propuesta (opcional)',values.proposedDate||'','date')}</div>${area('notes','Observaciones administrativas (opcional)',values.notes||'')}<div class="inline-actions"><button type="submit">Guardar borrador</button><button type="button" id="save-ready">Guardar y marcar listo para revisión local</button><button type="button" id="validate-draft">Validar</button><button type="reset">Limpiar formulario</button></div></form><div id="enrollment-validation"></div><section class="monitor-card"><h2>Relaciones vigentes del estudiante</h2><div id="enrollment-current"></div></section>`;
}
function currentDraft(){
 const form=root.querySelector('#enrollment-form'),data=Object.fromEntries(new FormData(form));
 return record?{...record,data:{...record.data,...data}}:{id:'preview',type:'enrollment',owner:'demo-admin',institutionId:'demo-institution',state:'draft',revision:0,version:0,data};
}
async function showCurrent(studentId){
 const container=root.querySelector('#enrollment-current');
 if(!studentId){container.innerHTML='<p>Selecciona un estudiante para consultar sus relaciones vigentes.</p>';return;}
 const relations=enrollmentsOfStudent(model,studentId);
 container.innerHTML=relations.length?`<ul>${relations.map(r=>`<li>Aula ${esc(r.roomId)} · ${esc(r.periodId||'Sin periodo confirmado')}</li>`).join('')}</ul>`:'<p>El estudiante no tiene relación de matrícula en la fuente base.</p>';
}
async function persist(ready){
 const form=root.querySelector('#enrollment-form'),data=Object.fromEntries(new FormData(form));
 try{const saved=await saveEnrollmentProposal(data,currentId||null,{ready});record=saved;guard.clear();root.querySelector('#enrollment-validation').innerHTML=validationPanel(saved.validation||{errors:[],warnings:[]},'Resultado del guardado local')+`<p>Estado local: ${esc(saved.state)} · Revisión ${saved.revision} · ${esc(formatDate(saved.updatedAt))}</p><p>La propuesta no modifica la matrícula vigente ni las asignaturas del estudiante.</p>`;root.querySelector('#enrollment-validation').dataset.record=saved.id;root.querySelector('#enrollment-validation').dataset.marker=saved.id+':'+saved.revision;if(!currentId){currentId=saved.id;history.replaceState(null,'','editar-matricula.html?id='+encodeURIComponent(saved.id));}}
 catch(error){root.querySelector('#enrollment-validation').innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo guardar</h2><p>${esc(error.message)}</p></section>`;}
}
async function load(){
  try{
  model=await organizationModel();
  options=Object.fromEntries(Object.entries(enrollmentOptions(model)).map(([key,values])=>[key,values.map(o=>[o.id,o.label])]));
  if(id){const data=await enrollmentDetail(id);record=data?.record||null;}
  const values=record?.data||{};
  root.innerHTML=`<div class="directory-toolbar">${orgLink('matriculas','Volver a matrículas')}${orgLink('index','Dashboard')}</div>${orgNote}<p class="demo-label">Borrador local · Sin efectos institucionales · Alias y códigos ficticios</p>${formMarkup(values)}${record?`<section class="monitor-card"><h2>Propuesta actual</h2><p>${esc(record.id)} · Estado ${esc(record.state)} · Revisión ${record.revision} · ${esc(formatDate(record.updatedAt))}</p></section>`:''}`;
  const form=root.querySelector('#enrollment-form');
  form.onsubmit=async e=>{e.preventDefault();await persist(false);};
  form.oninput=()=>{guard.set();showCurrent(form.elements.studentId?.value||'');};
  if(form.elements.studentId){form.elements.studentId.onchange=()=>showCurrent(form.elements.studentId.value);}
  root.querySelector('#save-ready').onclick=async()=>persist(true);
  root.querySelector('#validate-draft').onclick=async()=>{const draft=await currentDraft();const records=await listAcademicRecords('enrollment');const result=await validateOrganizationRecord(draft);root.querySelector('#enrollment-validation').innerHTML=validationPanel(result)+duplicateNotice(enrollmentDuplicates(model,records,draft));};
  if(form.elements.studentId){form.elements.studentId.value=values.studentId||presetStudent||'';showCurrent(form.elements.studentId.value);}
  else await showCurrent(values.studentId||presetStudent||'');
  if(form.elements.roomId)form.elements.roomId.value=values.roomId||presetRoom||'';
  if(form.elements.periodId)form.elements.periodId.value=values.periodId||'';
  if(form.elements.proposedDate)form.elements.proposedDate.value=values.proposedDate||'';
  if(form.elements.notes)form.elements.notes.value=values.notes||'';
  }catch(error){root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo abrir el editor</h2><p>${esc(error.message)}</p>${orgLink('matriculas','Volver a matrículas')}</section>`;}
}
await load();root.setAttribute('aria-busy','false');
