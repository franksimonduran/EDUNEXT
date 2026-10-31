import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {historyList} from '../services/admin-review-history.service.js';
import {listContentCatalog} from '../services/admin-contents.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Historial de Revisiones','review');
installAdminUserRoutes();

async function load(){
  const {rows}=await listContentCatalog({});
  const sel=root.querySelector('#hist-filters [name="content"]');
  sel.innerHTML='<option value="">Todos</option>'+rows.map(r=>`<option value="${esc(r.id)}">${esc(r.title)}</option>`).join('');
  const params=new URLSearchParams(location.search);
  Object.entries({content:params.get('content')||'',category:params.get('category')||'',state:params.get('state')||'',q:params.get('q')||''}).forEach(([k,v])=>{if(root.querySelector('#hist-filters [name="'+k+'"]'))root.querySelector('#hist-filters [name="'+k+'"]').value=v;});
  const items=await historyList({content:params.get('content')||'',category:params.get('category')||'',state:params.get('state')||'',q:params.get('q')||''});
  renderTable(items);
  bindFilters();
}

function renderTable(items){
  const tbody=root.querySelector('#hist-table tbody');
  const empty=root.querySelector('#hist-empty');
  const count=root.querySelector('#hist-count');
  if(!items.length){tbody.innerHTML='';empty.hidden=false;count.textContent='0 registros';return;}
  empty.hidden=true;
  count.textContent=`${items.length} revisiones`;
  tbody.innerHTML=items.map(r=>`
    <tr>
      <td>${esc(r.content)}</td>
      <td>${esc(r.version)}</td>
      <td>${esc(r.revisor)}</td>
      <td>${esc(r.date?new Date(r.date).toLocaleString('es'):'—')}</td>
      <td>${esc(r.category)}</td>
      <td>${esc(r.obs.slice(0,80))}${r.obs.length>80?'…':''}</td>
      <td><span class="badge ${r.state}">${esc(r.state)}</span></td>
      <td><button class="button-secondary" data-id="${r.id}">Detalle</button></td>
    </tr>
  `).join('');
}

function bindFilters(){
  const form=root.querySelector('#hist-filters');
  form.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(form));const p=new URLSearchParams();Object.entries(d).forEach(([k,v])=>{if(v)p.set(k,v);});location.search=p.toString();};
  form.onreset=()=>setTimeout(()=>location.search='',0);
}

load();