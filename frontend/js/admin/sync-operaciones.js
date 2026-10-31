import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listSyncOperations} from '../services/admin-sync-operations.service.js';
import {operationTable,operationDetailPanel,operationFilters} from '../components/admin-sync-operation.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Operaciones de Sincronización','sync');
installAdminUserRoutes();

let currentFilters={};

async function load(){
  renderFilters({});
  await loadOperations({});
  bindFilters();
}

function renderFilters(filters){
  root.querySelector('#op-filters').outerHTML=operationFilters(filters);
}

async function loadOperations(filters){
  currentFilters=filters;
  const ops=await listSyncOperations(filters);
  const container=root.querySelector('#operations-container');
  container.innerHTML=operationTable(ops);
  root.querySelector('#op-count').textContent=`${ops.length} operaciones`;
  bindTableActions();
}

function bindTableActions(){
  root.querySelector('#operations-container').onclick=async e=>{
    const btn=e.target.closest('[data-action]');
    if(!btn) return;
    const action=btn.dataset.action;
    const opId=btn.dataset.op;
    if(action==='detail'){
      const {listSyncOperations}=await import('../services/admin-sync-operations.service.js');
      const ops=await listSyncOperations({});
      const op=ops.find(o=>o.opId===opId);
      if(op) open('Detalle de Operación',operationDetailPanel(op));
    }else if(action==='retry'){
      const {retryOperation}=await import('../services/admin-sync.service.js');
      const result=await retryOperation(opId);
      if(result.ok){
        await loadOperations(currentFilters);
      }else{
        alert('Error al reintentar: '+result.reason);
      }
    }
  };
}

function bindFilters(){
  const form=root.querySelector('#op-filters');
  form.onsubmit=e=>{e.preventDefault();loadOperations(Object.fromEntries(new FormData(form)));};
  form.onreset=()=>setTimeout(()=>loadOperations({}),0);
}

load();
