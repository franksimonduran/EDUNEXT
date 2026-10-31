import {organizationShell,queryParams,installProposalActions,statusMessage,emptyState} from './organization-kernel.js';
import {enrollmentList,archiveEnrollmentProposal,deleteEnrollmentProposal,duplicateEnrollmentProposal} from '../services/admin-enrollments.service.js';
import {getAcademicRecord} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {enrollmentTable,enrollmentFilters,enrollmentSummary,duplicateNotice} from '../components/admin-enrollment-table.js';
import {orgLink,orgNote,validationPanel,esc,field,select,area} from '../components/admin-relationship-validation.js';
import {prepareStaticResources} from '../offline/monitor-preparation.js';
import {fetchEnrollmentWorkspace,fetchEnrollmentDetail,fetchTransferOptions,withdrawEnrollment,completeEnrollment,transferEnrollment,formatApiDate,statusLabel} from '../services/admin-enrollments-api.service.js';

const {root,open}=organizationShell('Matrículas','enrollments');
const params=queryParams(),raw=Object.fromEntries(params);
const apiFilters={page:Math.max(1,Number(raw.page)||1),search:raw.search||'',status:raw.status||'',yearId:raw.year||'',roomId:raw.room||''};
let data=null,live=null;

function network(message){const target=document.querySelector('#admin-network');if(target)target.textContent=message;}
function demoLabel(show){const target=document.querySelector('.demo-label');if(target)target.hidden=!show;}
function busy(value){root.setAttribute('aria-busy',String(value));}
function dialogClose(){document.querySelector('#admin-dialog')?.close();}
function optionMarkup(items){return items.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('');}

function demoToolbar(){return `<div class="directory-toolbar">${orgLink('index','Dashboard')}${orgLink('aulas','Aulas')}${orgLink('grados-secciones','Grados y Secciones')}${orgLink('asignaciones-docentes','Asignaciones Docentes')}${orgLink('editar-matricula','+ Preparar matrícula')}<button type="button" id="prepare-enrollments-offline">Preparar módulo offline</button></div><p id="org-message" role="status"></p>`;}

function viewDemo(){
 demoLabel(true);
 const s=data.statistics;
 root.innerHTML=`<p>Consulta las relaciones de matrícula de la demostración y prepara propuestas locales de matrícula, traslado o promoción. Ninguna propuesta modifica la matrícula vigente ni las asignaturas del estudiante.</p>${demoToolbar()}${enrollmentSummary([['Relaciones base',s.enrollments],['Estudiantes relacionados',s.students],['Aulas con matrícula',s.roomsWithStudents],['Propuestas locales',s.drafts],['Validación pendiente',s.incomplete]])}${orgNote}<form class="monitor-card" id="enrollment-filters">${enrollmentFilters({grades:data.model.grades.map(g=>({id:g.id,name:g.name})),rooms:data.model.rooms.map(r=>({id:r.id,label:`${r.code} · ${r.gradeName} ${r.section}`})),periods:[['all','Todos (incluye sin periodo)'],['undated','Sin periodo confirmado'],...data.model.periods.map(p=>[p.id,p.name])],values:raw})}<button type="reset">Limpiar filtros</button></form><p id="enrollment-count" role="status"></p><div id="enrollment-results"></div>`;
 const form=root.querySelector('#enrollment-filters');
 const render=()=>{const filters=Object.fromEntries(new FormData(form));const scope=data.rows.filter(r=>filters.state==='archived'?r.state==='archived':r.state!=='archived');const rows=scope.filter(r=>(!filters.search||((r.studentAlias||'')+' '+(r.studentCode||'')).toLowerCase().includes(String(filters.search).toLowerCase()))&&(!filters.grade||Number(r.grade)===Number(filters.grade))&&(!filters.room||r.roomId===filters.room)&&(!filters.period||filters.period==='all'||filters.period==='undated'&&!r.periodId||r.periodId===filters.period)&&(!filters.state||(filters.state==='base-demo'?r.kind==='base':r.state===filters.state)));
  root.querySelector('#enrollment-count').textContent=rows.length+' relaciones en la selección · '+rows.filter(r=>r.kind==='base').length+' base · '+rows.filter(r=>r.kind==='draft').length+' propuestas locales';
  root.querySelector('#enrollment-results').innerHTML=rows.length?enrollmentTable(rows):emptyState();};
 form.onsubmit=e=>e.preventDefault();
 form.oninput=render;
 form.onreset=()=>setTimeout(render,0);
 render();
}

function liveToolbar(){return `<div class="directory-toolbar">${orgLink('index','Dashboard')}${orgLink('aulas','Aulas')}${orgLink('grados-secciones','Grados y Secciones')}${orgLink('asignaciones-docentes','Asignaciones Docentes')}${orgLink('matriculas','Ver demostración',{modo:'demo'})}<button type="button" id="live-refresh">Actualizar API</button></div><p id="org-message" role="status"></p>`;}

function liveActions(row){
 const canTransition=row.state==='pending'||row.state==='active';
 const canComplete=row.state==='active';
 return `<div class="inline-actions"><button type="button" data-live-detail="${esc(row.id)}">Ver detalle</button>${canTransition?`<button type="button" data-live-transfer="${esc(row.id)}">Trasladar</button><button type="button" data-live-withdraw="${esc(row.id)}">Retirar</button>`:''}${canComplete?`<button type="button" data-live-complete="${esc(row.id)}">Culminar</button>`:''}</div>`;
}

function liveTable(rows){return `<div class="user-table-wrap" tabindex="0" role="region" aria-label="Matrículas institucionales"><table id="enrollment-table"><caption>Matrículas obtenidas del backend para la institución autenticada</caption><thead><tr>${['Estudiante','Aula','Grado','Periodo','Año','Estado','Acciones'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${esc(row.studentAlias)}<br><small>${esc(row.studentCode||'')}</small></th><td>${esc(row.roomLabel)}</td><td>${esc(row.gradeName||'-')}</td><td>${esc(row.periodLabel)}</td><td>${esc(row.academicYearLabel)}</td><td><span class="user-state">${esc(row.stateLabel)}</span></td><td>${liveActions(row)}</td></tr>`).join('')}</tbody></table></div><div class="user-cards">${rows.map(row=>`<article class="user-card"><h3>${esc(row.studentAlias)}</h3><p>${esc(row.studentCode||'')}</p><p>${esc(row.roomLabel)} · ${esc(row.gradeName||'-')}</p><p>${esc(row.periodLabel)} · ${esc(row.academicYearLabel)}</p><span class="user-state">${esc(row.stateLabel)}</span>${liveActions(row)}</article>`).join('')}</div>`;}

function viewLive(){
 demoLabel(false);
 const page=live.page,rows=live.rows;
 const active=rows.filter(row=>row.state==='active').length;
 const pending=rows.filter(row=>row.state==='pending').length;
 const totalPages=Math.max(1,page.pages||1);
 root.innerHTML=`<p>Consulta de matrículas institucionales. Los cambios de estado se guardan en el backend y requieren permisos administrativos.</p>${liveToolbar()}${enrollmentSummary([['Total filtrado',page.total],['Activas en la página',active],['Pendientes en la página',pending],['Página',page.page+' / '+totalPages]])}<p class="directory-note">Fuente: API institucional · Los filtros de estudiante, estado, año y aula se aplican en el servidor. La búsqueda incluye nombre, código, aula y denominación.</p><form class="monitor-card" id="live-enrollment-filters"><div class="directory-filters">${field('search','Buscar estudiante o aula',apiFilters.search,'search','maxlength="160"')}${select('status','Estado',[['','Todos'],...live.statusOptions],apiFilters.status)}${select('year','Año académico',[['','Todos'],...live.yearOptions],apiFilters.yearId)}${select('room','Aula',[['','Todas'],...live.classroomOptions],apiFilters.roomId)}</div><div class="inline-actions"><button type="submit">Aplicar filtros</button><button type="reset">Limpiar filtros</button></div></form><p id="enrollment-count" role="status">${page.total} matrículas · página ${page.page} de ${totalPages}</p><div id="enrollment-results">${rows.length?liveTable(rows):emptyState('No hay matrículas que coincidan con los filtros.')}</div><nav class="inline-actions" aria-label="Paginación"><button type="button" data-live-page="${page.page-1}" ${page.page<=1?'disabled':''}>Anterior</button><span>Página ${page.page} de ${totalPages}</span><button type="button" data-live-page="${page.page+1}" ${page.page>=totalPages?'disabled':''}>Siguiente</button></nav>`;
 const form=root.querySelector('#live-enrollment-filters');
 form.onsubmit=async e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));Object.assign(apiFilters,{page:1,search:values.search||'',status:values.status||'',yearId:values.year||'',roomId:values.room||''});await showLive();};
 form.onreset=()=>setTimeout(async()=>{Object.assign(apiFilters,{page:1,search:'',status:'',yearId:'',roomId:''});await showLive();},0);
}

async function loadLive(){live=await fetchEnrollmentWorkspace({page:apiFilters.page,pageSize:25,search:apiFilters.search,status:apiFilters.status,yearId:apiFilters.yearId,classroomId:apiFilters.roomId});}
async function showLive(){busy(true);network('Consultando API institucional…');try{await loadLive();viewLive();network('API institucional conectada · Datos del servidor');}finally{busy(false);}}

function actionButtons(row){return liveActions(row);}

function liveDetailMarkup(row){
 return `<section class="monitor-card"><h2>${esc(row.studentAlias)}</h2><dl><dt>Código</dt><dd>${esc(row.studentCode||'Sin código')}</dd><dt>Aula</dt><dd>${esc(row.roomLabel)}</dd><dt>Grado y sección</dt><dd>${esc(row.gradeName||'-')} ${esc(row.section||'')}</dd><dt>Año académico</dt><dd>${esc(row.academicYearLabel)}</dd><dt>Periodo</dt><dd>${esc(row.periodLabel)}</dd><dt>Estado</dt><dd>${esc(statusLabel(row.state))}</dd><dt>Matriculado</dt><dd>${esc(formatApiDate(row.enrolledAt))}</dd><dt>Fecha efectiva</dt><dd>${esc(formatApiDate(row.effectiveDate))}</dd><dt>Motivo de cierre</dt><dd>${esc(row.statusReason||'Sin motivo registrado')}</dd></dl>${actionButtons(row)}</section><section class="monitor-card"><h2>Historial de movimientos</h2>${row.movements.length?`<ul>${row.movements.map(m=>`<li><strong>${esc(m.typeLabel)}</strong> · ${esc(formatApiDate(m.effective_date))} · ${esc(m.reasonLabel)}${m.notes?' · '+esc(m.notes):''}</li>`).join('')}</ul>`:'<p>Sin movimientos registrados.</p>'}</section>`;
}

function liveActionForm({action,title,row,body,submitLabel}){
 open(title,`<form data-live-action="${action}" data-enrollment-id="${esc(row.id)}"><p><strong>${esc(row.studentAlias)}</strong> · ${esc(row.roomLabel)} · ${esc(row.stateLabel)}</p>${body}<div class="inline-actions"><button type="submit">${esc(submitLabel)}</button><button type="button" data-live-cancel>Cancelar</button></div><p data-live-error role="alert"></p></form>`);
}

function reasonOptions(items){return `<select name="reason_code" required>${optionMarkup(items)}</select>`;}
const withdrawReasons=[['family_request','Solicitud familiar'],['relocation','Traslado de residencia'],['health','Salud'],['economic','Económico'],['academic','Académico'],['other','Otro']];
const completeReasons=[['year_end','Fin de año'],['administrative','Administrativo'],['other','Otro']];
const transferReasons=[['family_request','Solicitud familiar'],['academic_reorganization','Reorganización académica'],['behavioral','Convivencia'],['capacity','Capacidad'],['other','Otro']];

async function openLiveDetail(enrollmentId){const row=await fetchEnrollmentDetail(enrollmentId);open('Detalle de matrícula',liveDetailMarkup(row));}
function openWithdraw(row){liveActionForm({action:'withdraw',title:'Registrar retiro',row,submitLabel:'Confirmar retiro',body:`<div class="form-grid"><label><span>Motivo</span>${reasonOptions(withdrawReasons)}</label>${field('effective_date','Fecha efectiva (opcional)','','date')}</div>${area('notes','Observaciones (opcional)','')}`});}
function openComplete(row){liveActionForm({action:'complete',title:'Culminar matrícula',row,submitLabel:'Confirmar culminación',body:`<div class="form-grid"><label><span>Motivo</span>${reasonOptions(completeReasons)}</label>${field('effective_date','Fecha efectiva (opcional)','','date')}</div>${area('notes','Observaciones (opcional)','')}`});}
async function openTransfer(row){
 const options=await fetchTransferOptions(row);
 if(!options.length){open('Traslado no disponible',`<p>No hay otra aula activa del mismo año y grado con la que pueda realizarse el traslado.</p>`);return;}
 liveActionForm({action:'transfer',title:'Trasladar matrícula',row,submitLabel:'Confirmar traslado',body:`<div class="form-grid"><label><span>Aula destino</span><select name="destination_classroom_id" required><option value="">Selecciona un aula</option>${optionMarkup(options)}</select></label><label><span>Motivo</span>${reasonOptions(transferReasons)}</label>${field('effective_date','Fecha efectiva (opcional)','','date')}</div>${area('notes','Observaciones (opcional)','')}`});
}

async function executeLiveForm(form){
 const action=form.dataset.liveAction,id=form.dataset.enrollmentId;
 const values=Object.fromEntries(new FormData(form));
 const submit=form.querySelector('button[type="submit"]');
 const previous=submit.textContent;
 submit.disabled=true;submit.textContent='Procesando…';
 try{
  if(action==='withdraw')await withdrawEnrollment(id,values);
  else if(action==='complete')await completeEnrollment(id,values);
  else if(action==='transfer')await transferEnrollment(id,values);
  else throw new Error('Operación no reconocida.');
 }catch(error){
  form.querySelector('[data-live-error]').textContent=error.message;
  submit.disabled=false;submit.textContent=previous;
  return;
 }
 submit.disabled=false;submit.textContent=previous;
 dialogClose();
 try{
  await showLive();
  statusMessage(root,action==='withdraw'?'Retiro registrado en el backend.':action==='complete'?'Culminación registrada en el backend.':'Traslado registrado en el backend.');
 }catch(error){
  network('La operación se guardó, pero no se pudo recargar la lista: '+error.message);
 }
}

document.addEventListener('submit',e=>{const form=e.target.closest('form[data-live-action]');if(!form)return;e.preventDefault();executeLiveForm(form);});
document.addEventListener('click',async e=>{
 const cancel=e.target.closest('[data-live-cancel]');
 if(cancel){dialogClose();return;}
 const pageButton=e.target.closest('[data-live-page]');
 if(pageButton){const next=Number(pageButton.dataset.livePage);if(next<1||next===apiFilters.page)return;apiFilters.page=next;await showLive();return;}
 const detail=e.target.closest('[data-live-detail]');
 if(detail){try{await openLiveDetail(detail.dataset.liveDetail);}catch(error){open('No se pudo cargar el detalle',`<p>${esc(error.message)}</p>`);}return;}
 const transition=e.target.closest('[data-live-withdraw],[data-live-complete],[data-live-transfer]');
 if(transition){try{const id=transition.dataset.liveWithdraw||transition.dataset.liveComplete||transition.dataset.liveTransfer;const row=await fetchEnrollmentDetail(id);if(transition.dataset.liveWithdraw)openWithdraw(row);else if(transition.dataset.liveComplete)openComplete(row);else await openTransfer(row);}catch(error){open('No se pudo preparar la operación',`<p>${esc(error.message)}</p>`);}return;}
 const refresh=e.target.closest('#live-refresh');
 if(refresh){refresh.disabled=true;try{await showLive();statusMessage(root,'Datos actualizados desde el backend.');}catch(error){open('No se pudo actualizar',`<p>${esc(error.message)}</p>`);}finally{refresh.disabled=false;}}
});

async function loadDemo(failure=null){
 data=await enrollmentList(raw);
 viewDemo();
 network('Demostración local · Sin datos del servidor');
 if(failure){
  const authFailure=failure.status===401||failure.status===403;
  const message=authFailure?'No hay una sesión administrativa válida. Se muestra la fuente de demostración.':'La API no está disponible. Se muestra la fuente de demostración.';
  root.insertAdjacentHTML('afterbegin',`<section class="monitor-card" role="status"><h2>${esc(message)}</h2><p>${esc(failure.message)}</p><p><a href="../login.html">Iniciar sesión</a> · ${orgLink('matriculas','Reintentar API',{modo:'api'})}</p></section>`);
 }
}

document.addEventListener('click',async e=>{const b=e.target.closest('#prepare-enrollments-offline');if(!b)return;b.disabled=true;try{const base=new URL('../../',import.meta.url),files=await prepareStaticResources(['matriculas','editar-matricula','aulas','grados-secciones','movimientos-academicos'].map(p=>new URL('admin/'+p+'.html',base).href),n=>statusMessage(root,n+' archivos preparados…'));statusMessage(root,'Módulo preparado offline: '+files.length+' archivos verificados en este dispositivo. Sin envío a servidor.');}catch(error){statusMessage(root,error.message);}finally{b.disabled=false;}});

installProposalActions({root,open,refresh:async()=>{await loadDemo();},load:async id=>{const record=await getAcademicRecord(id);return record&&record.type==='enrollment'?record:null;},handlers:{
 detail:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Propuesta local de matrícula',`<p>${esc(record.data?.studentId||'')}</p>${validationPanel(result)}`);},
 validate:async(record,{open})=>{const result=await validateOrganizationRecord(record);open('Validación local de la propuesta',validationPanel(result));},
 copy:async(record,{refresh})=>{await duplicateEnrollmentProposal(record);await refresh();statusMessage(root,'Propuesta duplicada como nueva matrícula local.');},
 archive:async(record,{refresh})=>{if(confirm('¿Archivar esta propuesta local de matrícula?')){await archiveEnrollmentProposal(record);await refresh();statusMessage(root,'Propuesta archivada localmente.');}},
 delete:async(record,{refresh})=>{if(confirm('¿Eliminar esta propuesta local de matrícula?')){await deleteEnrollmentProposal(record);await refresh();statusMessage(root,'Propuesta eliminada del dispositivo.');}}
}});

(async()=>{
 busy(true);
 try{
  if(raw.modo!=='demo'&&navigator.onLine!==false){
   try{await showLive();return;}catch(error){await loadDemo(error);return;}
  }
  await loadDemo();
 }catch(error){
  root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo cargar la información de matrículas</h2><p>${esc(error.message)}</p>${orgLink('index','Volver al panel')}</section>`;
 }finally{busy(false);}
})();
