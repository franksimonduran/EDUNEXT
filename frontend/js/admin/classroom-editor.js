import {organizationShell,queryValue,createGuard,installUnsavedGuard,formatDate,emptyState} from './organization-kernel.js';
import {saveClassroomProposal,classroomDetail} from '../services/admin-classrooms.service.js';
import {getAcademicRecord} from '../services/admin-organization-drafts.service.js';
import {validateOrganizationRecord} from '../services/admin-organization-validation.service.js';
import {orgLink,orgNote,validationPanel,esc,field,select,area} from '../components/admin-relationship-validation.js';
import {organizationModel} from '../utils/academic-relations.js';
const {root,open}=organizationShell('Preparar Aula','rooms');
const guard=createGuard();installUnsavedGuard(guard);
const id=queryValue('id');
let model=null,record=null;
let currentId=id;
function formMarkup(values){
 return `<form class="monitor-card" id="classroom-form"><h2>${id?'Editar borrador de aula':'Nueva propuesta local de aula'}</h2><div class="form-grid">${field('code','Código ficticio del aula (DEMO-AULA-…)',values.code||'','text','maxlength="32" required')}${select('grade','Grado',[['','Selecciona un grado'],...model.grades.map(g=>[g.id,g.name])],values.grade??'')}${field('section','Sección',values.section||'','text','maxlength="3" required')}${select('periodId','Periodo académico',[['','Selecciona un periodo'],...model.periods.map(p=>[p.id,p.name])],values.periodId||'')}${field('name','Denominación opcional',values.name||'','text','maxlength="80"')}${field('capacity','Capacidad referencial (opcional)',values.capacity??'','number','min="1" max="60"')}</div>${area('description','Descripción organizativa (opcional)',values.description||'')}${area('notes','Observaciones administrativas (opcional)',values.notes||'')}<div class="inline-actions"><button type="submit">Guardar borrador</button><button type="button" id="save-ready">Guardar y marcar listo para revisión local</button><button type="button" id="validate-draft">Validar</button><button type="reset">Limpiar formulario</button></div></form><div id="classroom-validation"></div>`;
}
function bind(values){
 root.querySelector('#classroom-form').onsubmit=async e=>{e.preventDefault();await persist(false);};
 root.querySelector('#save-ready').onclick=async()=>{await persist(true);};
 root.querySelector('#validate-draft').onclick=async()=>{const draft=await currentDraft();const result=await validateOrganizationRecord(draft);root.querySelector('#classroom-validation').innerHTML=validationPanel(result);};
 root.querySelector('#classroom-form').oninput=()=>guard.set();
}
async function currentDraft(){
 const form=root.querySelector('#classroom-form'),data=Object.fromEntries(new FormData(form));
 const draft=record?{...record,data:{...record.data,...data}}:{id:'preview',type:'classroom',owner:'demo-admin',institutionId:'demo-institution',state:'draft',revision:0,version:0,data};
 return draft;
}
async function persist(ready){
 const form=root.querySelector('#classroom-form'),data=Object.fromEntries(new FormData(form));
 try{const saved=await saveClassroomProposal(data,currentId||null,{ready});record=saved;guard.clear();root.querySelector('#classroom-validation').innerHTML=validationPanel(saved.validation||{errors:[],warnings:[]},'Resultado del guardado local')+`<p>Estado local: ${esc(saved.state)} · Revisión ${saved.revision} · ${esc(formatDate(saved.updatedAt))}</p><p>El borrador queda en este dispositivo y no crea el aula en la institución.</p>`;root.querySelector('#classroom-validation').dataset.record=saved.id;root.querySelector('#classroom-validation').dataset.marker=saved.id+':'+saved.revision;if(!currentId){currentId=saved.id;history.replaceState(null,'','editar-aula.html?id='+encodeURIComponent(saved.id));}}
 catch(error){root.querySelector('#classroom-validation').innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo guardar</h2><p>${esc(error.message)}</p></section>`;}
}
async function load(){
 model=await organizationModel();
 if(id){const data=await classroomDetail(id);record=data?.record||null;}
 const values=record?.data||{grade:model.grades[0]?.id||''};
 root.innerHTML=`<div class="directory-toolbar">${orgLink('aulas','Volver a aulas')}${orgLink('index','Dashboard')}</div>${orgNote}<p class="demo-label">Borrador local · Sin efectos institucionales · Alias y códigos ficticios</p>${formMarkup(values)}${record?`<section class="monitor-card"><h2>Borrador actual</h2><p>${esc(record.id)} · Estado ${esc(record.state)} · Revisión ${record.revision} · ${esc(formatDate(record.updatedAt))}</p></section>`:''}`;
 bind(values);
}
try{await load();}catch(error){root.innerHTML=`<section class="monitor-card" role="alert"><h2>No se pudo abrir el editor</h2><p>${esc(error.message)}</p>${orgLink('aulas','Volver a aulas')}</section>`;}finally{root.setAttribute('aria-busy','false');}
