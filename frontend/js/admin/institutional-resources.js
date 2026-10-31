import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listContentCatalog,listReviewProposals} from '../services/admin-contents.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';
import {orgSummary} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Recursos Institucionales','review');
let resources=[];
installAdminUserRoutes();

async function load(){
  const {rows}=await listContentCatalog({});
  const props=await listReviewProposals({});
  const all=[...rows,...props];
  resources=[...new Map(all.flatMap(c=>c.resources||[]).map(r=>[r.id,r])).values()];
  renderSummary(resources);
  renderGrid(resources);
  bindFilters();
}

function renderSummary(resources){
  const img=resources.filter(r=>r.type==='image').length;
  const aud=resources.filter(r=>r.type==='audio').length;
  const doc=resources.filter(r=>r.type==='document').length;
  const off=resources.filter(r=>r.offline==='yes').length;
  root.querySelector('#res-summary').innerHTML=orgSummary([
    ['Total',resources.length],['Imágenes',img],['Audios',aud],['Documentos',doc],['Offline OK',off],['Pendientes',resources.length-off]
  ]);
}

function renderGrid(resources){
  const grid=root.querySelector('#resources-grid');
  const empty=root.querySelector('#res-empty');
  const count=root.querySelector('#res-count');
  if(!resources.length){grid.innerHTML='';empty.hidden=false;count.textContent='0 recursos';return;}
  empty.hidden=true;
  count.textContent=`${resources.length} recursos`;
  grid.innerHTML=resources.map(r=>`
    <article class="resource-card dashboard-card">
      <header><strong>${esc(r.name)}</strong><span class="badge ${r.type}">${esc(r.type)}</span></header>
      <dl><dt>Tipo</dt><dd>${esc(r.type)}</dd><dt>Grado</dt><dd>${r.grade?r.grade+'º':'—'}</dd>
      <dt>Curso</dt><dd>${esc(r.course||'—')}</dd><dt>Offline</dt><dd>${r.offline==='yes'?'✅':'⚠️'}</dd></dl>
      <div class="actions"><button class="button-secondary" data-id="${r.id}">Detalle</button></div>
    </article>
  `).join('');
}

function bindFilters(){
  const form=root.querySelector('#res-filters');
  form.onsubmit=e=>{e.preventDefault();renderGrid(filterResources(new FormData(form)));};
  form.oninput=()=>renderGrid(filterResources(new FormData(form)));
  form.onreset=()=>{setTimeout(()=>renderGrid(resources),0);};
}

function filterResources(fd){
  const f=Object.fromEntries(fd);
  return resources.filter(r=>(!f.type||r.type===f.type)&&(!f.grade||String(r.grade)===f.grade)&&(!f.course||r.courseId===f.course)&&(!f.q||(r.name||'').toLocaleLowerCase().includes(f.q.toLocaleLowerCase())));
}

load();
