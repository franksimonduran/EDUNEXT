import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listContentCatalog,getCourseUnits} from '../services/admin-contents.service.js';
import {listReviewProposals} from '../services/admin-contents.service.js';
import {validateContent} from '../services/admin-content-validation.service.js';
import {checkOfflineReadiness} from '../services/admin-offline-packages.service.js';
import {diffVersions} from '../services/admin-content-versions.service.js';
import {renderLessonBlocks} from '../components/lesson-content.js';
import {at,esc,orgSummary} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Detalle de Contenido','content');
installAdminUserRoutes();

async function load(){
  const id=new URLSearchParams(location.search).get('id');
  const {rows}=await listContentCatalog({});
  const item=rows.find(r=>r.id===id)||await findProposal(id);
  if(!item){root.innerHTML=`<section class="monitor-card"><h2>No encontrado</h2><p>El contenido solicitado no está disponible en este entorno.</p></section>`;return;}
  renderHero(item);
  renderPanels(item);
  wireLinks(item);
}

async function findProposal(id){
  const props=await listReviewProposals({});
  return props.find(p=>p.id===id)||null;
}

function renderHero(it){
  const hero=root.querySelector('#content-hero');
  hero.innerHTML=`
    <h2>${esc(it.title)}</h2>
    <dl><dt>Tipo</dt><dd>${esc(it.type||'—')}</dd>
      <dt>Curso</dt><dd>${esc(it.courseName||'—')}</dd>
      <dt>Grado</dt><dd>${it.grade?it.grade+'º':'—'}</dd>
      <dt>Unidad</dt><dd>${esc(it.unitTitle||'—')}</dd>
      <dt>Tema</dt><dd>${esc(it.theme||'—')}</dd>
      <dt>Versión</dt><dd>${esc(it.version||'—')}</dd>
      <dt>Estado</dt><dd>${esc(it.state||'—')}</dd>
      <dt>Origen</dt><dd>${esc(it.source||'Catálogo base')}</dd></dl>
  `;
}

function renderPanels(it){
  const info=root.querySelector('#info-body');
  info.innerHTML=`<p>${esc(it.objective||it.desc||'Sin descripción.')}</p>`;
  const struct=root.querySelector('#structure-body');
  struct.innerHTML=`<dl><dt>Curso</dt><dd>${esc(it.courseName)}</dd><dt>Grado</dt><dd>${it.grade}º</dd><dt>Unidad</dt><dd>${esc(it.unitId||'—')}</dd></dl>`;
  const blocks=root.querySelector('#blocks-body');
  blocks.innerHTML=(it.blocks||[]).map(b=>`<div class="block-item"><span class="block-type">${esc(b.type)}</span><p>${esc(b.text||'')}</p></div>`).join('')||'<p class="muted">Sin bloques.</p>';
  const res=root.querySelector('#resources-body');
  res.innerHTML=(it.resources||[]).map(r=>`<div class="resource-item"><strong>${esc(r.name)}</strong><span class="badge">${esc(r.type)}</span><br>${esc(r.path||r.src||'—')}</div>`).join('')||'<p class="muted">Sin recursos.</p>';
  const ver=root.querySelector('#versions-body');
  ver.innerHTML=`<p>${esc(it.version||'v1.0')} — ${it.source||'base'}</p>`;
  const val=validateContent(it);
  const vbody=root.querySelector('#validations-body');
  vbody.innerHTML=`<p>Errores: ${val.summary.errors} · Advertencias: ${val.summary.warnings}</p>`;
  const ready=checkOfflineReadiness(it);
  const deps=root.querySelector('#deps-body');
  deps.innerHTML=`<p>${ready.prepared?'Preparado':'Incompleto'} — ${ready.issues.length} recursos no verificados.</p>`;
}

function wireLinks(it){
  root.querySelector('#link-versions').href='versiones-contenido.html?id='+encodeURIComponent(it.id);
  root.querySelector('#link-validation').href='validacion-contenidos.html?id='+encodeURIComponent(it.id);
  root.querySelector('#preview-content').onclick=()=>preview(it);
}

function preview(it){
  open('Vista previa — '+esc(it.title),`
    <p class="muted">Vista previa administrativa — No publicada.</p>
    <header class="lesson-header"><h2>${esc(it.title)}</h2><p>${esc(it.objective||'')}</p></header>
    <div class="lesson-reading">${renderLessonBlocks(it.blocks||[],it.resources||[])}</div>
  `);
}

load();
