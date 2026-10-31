import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listContentCatalog,courseMap} from '../services/admin-contents.service.js';
import {at,esc,field,select,orgSummary,emptyState} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Contenidos Educativos','content');
installAdminUserRoutes();

async function load(){
  const params=new URLSearchParams(location.search);
  const filters={grade:params.get('grade')||'',course:params.get('course')||'',type:params.get('type')||'',state:params.get('state')||'',q:params.get('q')||''};
  const {rows,summary}=await listContentCatalog(filters);
  renderSummary(summary);
  renderCatalog(rows,filters);
  bindFilters(filters);
}

function renderSummary(s){
  const el=root.querySelector('#contents-summary');
  el.innerHTML=orgSummary([
    ['Cursos',s.courses],['Unidades',s.units],['Lecciones',s.lessons],
    ['Recursos',s.resources],['Propuestas',s.proposals],['Con errores',s.errors]
  ]);
}

function renderCatalog(rows,filters){
  const grid=root.querySelector('#contents-catalog');
  const empty=root.querySelector('#contents-empty');
  const count=root.querySelector('#contents-count');
  if(!rows.length){grid.innerHTML='';empty.hidden=false;count.textContent='0 contenidos';return;}
  empty.hidden=true;
  count.textContent=`${rows.length} contenidos`;
  grid.innerHTML=rows.map(r=>`
    <article class="content-card dashboard-card">
      <header><strong>${esc(r.title)}</strong><span class="badge ${r.state}">${esc(r.state)}</span></header>
      <dl><dt>Curso</dt><dd>${esc(r.courseName)}</dd><dt>Grado</dt><dd>${r.grade}º</dd>
      <dt>Tipo</dt><dd>${esc(r.type)}</dd></dl>
      <div class="actions"><button class="button-secondary" data-open="${r.id}">Ver detalle</button></div>
    </article>
  `).join('');
}

function bindFilters(initial){
  const form=root.querySelector('#contents-filters');
  Object.entries(initial).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v;});
  form.oninput=async()=>{const d=Object.fromEntries(new FormData(form));const {rows}=await listContentCatalog(d);renderCatalog(rows,d);};
  form.onsubmit=e=>e.preventDefault();
  form.onreset=()=>setTimeout(()=>location.search='',0);
  root.querySelector('#contents-catalog').onclick=e=>{
    const b=e.target.closest('[data-open]');
    if(b)location.assign('detalle-contenido.html?id='+encodeURIComponent(b.dataset.open));
  };
  root.querySelector('#back-to-catalog').onclick=()=>{root.querySelector('#units-section').hidden=true;root.querySelector('.catalog-section').hidden=false;};
}

load();
