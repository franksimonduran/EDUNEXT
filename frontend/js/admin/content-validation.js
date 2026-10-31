import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listContentCatalog,listReviewProposals} from '../services/admin-contents.service.js';
import {validateContent} from '../services/admin-content-validation.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Validación de Contenidos','review');
installAdminUserRoutes();

async function load(){
  const {rows}=await listContentCatalog({});
  const props=await listReviewProposals({});
  const items=[...rows,...props];
  const sel=root.querySelector('#val-content');
  sel.innerHTML='<option value="">Seleccionar</option>'+items.map(i=>`<option value="${esc(i.id)}">${esc(i.title)} (${i.type})</option>`).join('');
  root.querySelector('#run-validation').onclick=run;
}

async function run(){
  const id=root.querySelector('#val-content').value;
  if(!id)return;
  const {rows}=await listContentCatalog({});
  const props=await listReviewProposals({});
  const item=[...rows,...props].find(x=>x.id===id);
  if(!item){open('No encontrado','<p>Contenido no disponible.</p>');return;}
  const result=validateContent(item);
  renderResult(item,result);
}

function renderResult(item,result){
  root.querySelector('#val-meta').textContent=`${item.title} — ${result.ranAt}`;
  root.querySelector('#val-summary').innerHTML=`<div class="summary-item error"><span>${result.summary.errors}</span>Errores</div><div class="summary-item warning"><span>${result.summary.warnings}</span>Advertencias</div><div class="summary-item ok"><span>${Object.values(result.sections).flat().filter(x=>x.type!=='error'&&x.type!=='warning').length}</span>Correctas</div>`;
  const sections={structure:'val-structure',content:'val-content-blocks',resources:'val-resources',access:'val-access',compat:'val-compat',offline:'val-offline',security:'val-security'};
  Object.entries(sections).forEach(([key,sel])=>{
    const sec=result.sections[key];
    const el=root.querySelector('#'+sel);
    el.innerHTML=(sec.errors.map(e=>`<li class="error">${esc(e.desc)}</li>`).join('')||'')+(sec.warnings.map(w=>`<li class="warning">${esc(w.desc)}</li>`).join('')||'<li class="ok">Sin problemas</li>');
  });
  root.querySelector('#val-details').innerHTML=result.errors.concat(result.warnings).map(r=>`<div class="detail ${r.type}"><strong>${esc(r.rule)}</strong>: ${esc(r.desc)}</div>`).join('');
}

load();