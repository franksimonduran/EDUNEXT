import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listContentCatalog,listReviewProposals} from '../services/admin-contents.service.js';
import {validateContent} from '../services/admin-content-validation.service.js';
import {listContentReviews} from '../services/admin-content-review.service.js';
import {checkOfflineReadiness} from '../services/admin-offline-packages.service.js';
import {savePublicationPrep} from '../services/admin-content-review.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Preparación de Publicación','review');
installAdminUserRoutes();

async function load(){
  const {rows}=await listContentCatalog({});
  const props=await listReviewProposals({});
  const items=[...rows,...props];
  const sel=root.querySelector('#prep-content');
  sel.innerHTML='<option value="">Seleccionar</option>'+items.map(i=>`<option value="${esc(i.id)}">${esc(i.title)} (${i.type})</option>`).join('');
  sel.onchange=()=>loadContent(sel.value);
  root.querySelector('#prep-form').onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(e.target));
    const id=sel.value;
    const prep={contentId:id,contentTitle:items.find(x=>x.id===id)?.title,version:root.querySelector('#prep-version').value,changes:d.changes,reason:d.reason,period:d.period,status:'draft',savedAt:new Date().toISOString()};
    await savePublicationPrep(prep);
    open('Guardado','<p>Preparación guardada localmente.</p>');
  };
}

async function loadContent(id){
  if(!id){clear();return;}
  const {rows}=await listContentCatalog({});
  const props=await listReviewProposals({});
  const item=[...rows,...props].find(x=>x.id===id);
  if(!item){clear();return;}
  const vers=item.version||'v1.0';
  const vsel=root.querySelector('#prep-version');
  vsel.innerHTML=`<option value="${vers}">${vers}</option>`;
  root.querySelector('#prep-course').value=`${item.courseName} / ${item.grade}º`;
  const val=validateContent(item);
  const reviews=await listContentReviews();
  const itemReviews=reviews.filter(r=>r.proposalId===id);
  const ready=checkOfflineReadiness(item);
  renderVal(val);
  renderObs(itemReviews);
  renderRes(item);
  renderDeps(ready);
  renderOffline(ready);
  renderImpact(item);
}

function renderVal(v){
  root.querySelector('#prep-val').innerHTML=`<p>${v.summary.errors===0?'✅ Sin errores':'❌ '+v.summary.errors+' errores'} · ${v.summary.warnings} advertencias</p>`;
}
function renderObs(r){
  root.querySelector('#prep-obs').innerHTML=r.map(x=>`<div class="obs"><strong>${x.category}</strong>: ${x.observations.map(o=>o.text).join('; ')}</div>`).join('')||'<p class="muted">Sin observaciones registradas.</p>';
}
function renderRes(it){
  root.querySelector('#prep-res').innerHTML=(it.resources||[]).map(r=>`<div>${r.offline==='yes'?'✅':'⚠️'} ${esc(r.name)}</div>`).join('')||'<p class="muted">Sin recursos.</p>';
}
function renderDeps(r){
  root.querySelector('#prep-deps').innerHTML=r.deps.map(d=>`<div>${d.ok?'✅':'⚠️'} ${d.id}</div>`).join('');
}
function renderOffline(r){
  root.querySelector('#prep-offline').innerHTML=`<p>${r.prepared?'✅ Preparado':'⚠️ Incompleto'} — ${r.issues.length} pendientes</p>`;
}
function renderImpact(it){
  root.querySelector('#prep-impact').innerHTML=`<p>Lecciones: ${it.blocks?.length||0} bloques · Recursos: ${(it.resources||[]).length}</p>`;
}
function renderDecision(it){
  root.querySelector('#prep-decision').innerHTML=`<p>Contenido: ${esc(it.title)} · v${it.version}</p>`;
}
function clear(){
  root.querySelector('#prep-version').innerHTML='';
  root.querySelector('#prep-course').value='';
  ['prep-val','prep-obs','prep-res','prep-deps','prep-offline','prep-impact'].forEach(id=>root.querySelector('#'+id).innerHTML='');
}

load();