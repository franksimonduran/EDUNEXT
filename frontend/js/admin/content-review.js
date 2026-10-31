import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listReviewProposals} from '../services/admin-contents.service.js';
import {saveContentReview,listContentReviews} from '../services/admin-content-review.service.js';
import {at,esc} from '../components/admin-dashboard-ui.js';
import {orgSummary} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Centro de Revisión de Contenidos','review');
installAdminUserRoutes();

async function load(){
  const params=new URLSearchParams(location.search);
  const filters={course:params.get('course')||'',grade:params.get('grade')||'',type:params.get('type')||'',author:params.get('author')||'',reviewState:params.get('reviewState')||'',valState:params.get('valState')||'',q:params.get('q')||''};
  const rows=await listReviewProposals(filters);
  const reviews=await listContentReviews();
  renderSummary(rows,reviews);
  renderTable(rows);
  bindFilters(filters);
}

function renderSummary(props,reviews){
  const s={
    accessible:props.length,
    pending:props.filter(p=>p.state==='sin-revisar'||p.state==='en-revision').length,
    withObs:props.filter(p=>reviews.some(r=>r.proposalId===p.id)).length,
    verified:props.filter(p=>p.state==='completado').length,
    errors:props.filter(p=>reviews.some(r=>r.proposalId===p.id&&r.status==='error')).length,
    completed:props.filter(p=>p.state==='completado').length
  };
  root.querySelector('#review-summary').innerHTML=orgSummary([
    ['Accesibles',s.accessible],['Pendientes',s.pending],['Con observaciones',s.withObs],
    ['Técnicamente verificados',s.verified],['Con errores',s.errors],['Completados',s.completed]
  ]);
}

function renderTable(props){
  const tbody=root.querySelector('#review-table tbody');
  const empty=root.querySelector('#review-empty');
  const count=root.querySelector('#review-count');
  if(!props.length){tbody.innerHTML='';empty.hidden=false;count.textContent='0 propuestas';return;}
  empty.hidden=true;
  count.textContent=`${props.length} propuestas`;
  tbody.innerHTML=props.map(p=>`
    <tr>
      <td>${esc(p.title)}</td>
      <td>${esc(p.type)}</td>
      <td>${esc(p.courseName)}</td>
      <td>${p.grade}º</td>
      <td>${esc(p.author)}</td>
      <td>${esc(p.version)}</td>
      <td>${esc(p.createdAt?new Date(p.createdAt).toLocaleDateString('es'):'—')}</td>
      <td><span class="badge ${p.state}">${esc(p.state)}</span></td>
      <td><span class="badge">${esc(p.state==='completado'?'ok':p.state)}</span></td>
      <td><a class="button-secondary" href="revisar-contenido.html?id=${encodeURIComponent(p.id)}">Revisar</a></td>
    </tr>
  `).join('');
}

function bindFilters(initial){
  const form=root.querySelector('#review-filters');
  Object.entries(initial).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v;});
  form.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(form));const p=new URLSearchParams();Object.entries(d).forEach(([k,v])=>{if(v)p.set(k,v);});location.search=p.toString();};
  form.onreset=()=>setTimeout(()=>location.search='',0);
}

load();