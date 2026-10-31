import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listContentCatalog,listReviewProposals} from '../services/admin-contents.service.js';
import {checkOfflineReadiness} from '../services/admin-offline-packages.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Paquetes Educativos Offline','review');
installAdminUserRoutes();

async function load(){
  const {rows}=await listContentCatalog({});
  const props=await listReviewProposals({});
  const items=[...rows,...props];
  const sel=root.querySelector('#pkg-content');
  sel.innerHTML='<option value="">Seleccionar</option>'+items.map(i=>`<option value="${esc(i.id)}">${esc(i.title)} (${i.type})</option>`).join('');
  sel.onchange=()=>populateVersions(sel.value);
  root.querySelector('#check-package').onclick=check;
}

function populateVersions(id){
  if(!id){clear();return;}
  const versions=['v1.0'];
  const s=root.querySelector('#pkg-version');
  s.innerHTML='<option value="">Seleccionar</option>'+versions.map(v=>`<option value="${v}">${v}</option>`).join('');
}

function clear(){
  root.querySelector('#pkg-version').innerHTML='<option value="">Seleccionar</option>';
  ['pkg-manifest','pkg-required','pkg-optional','pkg-deps','pkg-ready'].forEach(id=>root.querySelector('#'+id).innerHTML='');
}

async function check(){
  const id=root.querySelector('#pkg-content').value;
  const ver=root.querySelector('#pkg-version').value;
  if(!id||!ver){open('Seleccione','<p>Elija contenido y versión.</p>');return;}
  const {rows}=await listContentCatalog({});
  const item=rows.find(r=>r.id===id);
  if(!item){open('No disponible','<p>Contenido no disponible.</p>');return;}
  const ready=checkOfflineReadiness({...item,version:ver});
  renderManifest(item,ver,ready);
}

function renderManifest(item,ver,ready){
  root.querySelector('#pkg-manifest').innerHTML=`<dl><dt>ID</dt><dd>${esc(item.id)}</dd><dt>Versión</dt><dd>${esc(ver)}</dd><dt>Lecciones</dt><dd>${item.blocks?.length||0} bloques</dd><dt>Recursos</dt><dd>${(item.resources||[]).length}</dd></dl>`;
  root.querySelector('#pkg-required').innerHTML=ready.required.map(r=>`<div class="res-item ${r.offline==='yes'?'ok':'warn'}">${esc(r.name)} — ${r.offline==='yes'?'OK':'Pendiente'}</div>`).join('');
  root.querySelector('#pkg-optional').innerHTML='<p class="muted">Sin opcionales definidos.</p>';
  root.querySelector('#pkg-deps').innerHTML=ready.deps.map(d=>`<div class="dep ${d.ok?'ok':'warn'}">${d.id} — ${d.ok?'Satisfecha':'Pendiente'}</div>`).join('');
  root.querySelector('#pkg-ready').innerHTML=`<p class="${ready.prepared?'ok':'warn'}">${ready.prepared?'Preparado para empaquetado':'Incompleto'}</p><ul>${ready.issues.map(i=>`<li>${esc(i.msg)}</li>`).join('')}</ul>`;
}

load();