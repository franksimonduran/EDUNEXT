import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listReviewProposals} from '../services/admin-contents.service.js';
import {validateContent} from '../services/admin-content-validation.service.js';
import {saveContentReview,getContentReview} from '../services/admin-content-review.service.js';
import {checkOfflineReadiness} from '../services/admin-offline-packages.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';
import {renderLessonBlocks} from '../components/lesson-content.js';

const {root,open}=adminShell('Revisión de Contenido Educativo','review');
installAdminUserRoutes();

let proposal=null;

async function load(){
  const id=new URLSearchParams(location.search).get('id');
  const props=await listReviewProposals({});
  proposal=props.find(p=>p.id===id)||null;
  if(!proposal){root.innerHTML=`<section class="monitor-card"><h2>Propuesta no accesible</h2><p>No hay borradores locales de este contenido en este dispositivo.</p></section>`;return;}
  renderMeta(proposal);
  renderStructure(proposal);
  renderPreview(proposal);
  renderCriteria(proposal);
  loadSavedReview();
  bindActions();
}

function renderMeta(p){
  root.querySelector('#proposal-meta').textContent=`${p.courseName} · ${p.grade}º · ${p.unitTitle} · v${p.version} · ${p.author} · ${p.source}`;
}

function renderStructure(p){
  const body=root.querySelector('#structure-body');
  body.innerHTML=`<dl><dt>Título</dt><dd>${esc(p.title)}</dd><dt>Objetivo</dt><dd>${esc(p.objective)}</dd><dt>Bloques</dt><dd>${p.blocks.length}</dd></dl>`;
  const sel=root.querySelector('#obs-form [name="blockId"]');
  sel.innerHTML='<option value="">Sin asociar</option>'+p.blocks.map(b=>`<option value="${esc(b.id)}">${esc(b.type)}: ${esc(b.id)}</option>`).join('');
}

function renderPreview(p){
  const body=root.querySelector('#preview-body');
  body.innerHTML=renderLessonBlocks(p.blocks||[],p.resources||[])||'<p class="muted">Sin contenido.</p>';
}

function renderCriteria(p){
  const val=validateContent(p);
  const struct=root.querySelector('#crit-struct');
  struct.innerHTML=val.sections.structure.errors.map(e=>`<li class="error">${esc(e.desc)}</li>`).join('')||'<li class="ok">Correcto</li>';
  const ped=root.querySelector('#crit-ped');
  ped.innerHTML=['Objetivo educativo comprensible','Explicación apropiada para el grado','Secuencia de contenidos lógica','Ejemplos claros','Instrucciones comprensibles','Actividades relacionadas con el tema','Nivel de dificultad adecuado','Uso correcto de términos','Recursos que apoyan el aprendizaje','Ausencia de contenido inapropiado'].map(t=>`<li><label><input type="checkbox" data-crit="${t}"> ${esc(t)}</label></li>`).join('');
  const acc=root.querySelector('#crit-access');
  acc.innerHTML=['Jerarquía de encabezados','Imágenes con texto alternativo','Audio con alternativa textual','Contraste','Controles accesibles','Navegación por teclado','Responsive','Tamaño de texto','No dependencia exclusiva de colores','Sin animaciones innecesarias'].map(t=>`<li><label><input type="checkbox" data-crit="${t}"> ${esc(t)}</label></li>`).join('');
  const res=root.querySelector('#crit-res');
  res.innerHTML=(p.resources||[]).map(r=>`<li>${r.offline==='yes'?'✅':'⚠️'} ${esc(r.name)} (${esc(r.type)}) — ${r.offline==='yes'?'Disponible':'No verificado'}</li>`).join('')||'<li class="muted">Sin recursos.</li>';
}

async function loadSavedReview(){
  const rev=await getContentReview('review-'+proposal.id+':'+proposal.version);
  if(rev){
    document.querySelector('#obs-list').innerHTML=rev.observations.map(o=>`<div class="obs-item"><strong>${esc(o.category)}</strong> ${esc(o.blockId?'['+o.blockId+'] ':'')}${esc(o.text)} <small>${new Date(o.date).toLocaleString('es')}</small></div>`).join('');
    if(rev.status==='completado')root.querySelector('#complete-review').textContent='Revisión completada localmente';
  }
}

function bindActions(){
  root.querySelector('#obs-form').onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(e.target));
    const obs={id:crypto.randomUUID(),category:d.category,blockId:d.blockId,text:d.text,date:new Date().toISOString()};
    const existing=await getContentReview('review-'+proposal.id+':'+proposal.version);
    const review={proposalId:proposal.id,proposalTitle:proposal.title,version:proposal.version,observations:[...(existing?.observations||[]),obs],status:existing?.status||'con-observaciones',revisor:'demo-admin',updatedAt:new Date().toISOString()};
    await saveContentReview(review);
    e.target.reset();
    loadSavedReview();
  };
  root.querySelector('#complete-review').onclick=async()=>{
    const existing=await getContentReview('review-'+proposal.id+':'+proposal.version);
    const review={proposalId:proposal.id,proposalTitle:proposal.title,version:proposal.version,observations:(existing?.observations||[]),status:'completado',revisor:'demo-admin',updatedAt:new Date().toISOString()};
    await saveContentReview(review);
    root.querySelector('#complete-review').textContent='Revisión completada localmente';
    root.querySelector('#complete-review').disabled=true;
  };
}

load();
