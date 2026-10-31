import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {scanForIncidents,getIncidents,getIncidentDetail,markIncidentReviewed,markIncidentResolved,getIncidentStats} from '../services/admin-technical-incidents.service.js';
import {technicalIncidentCard,incidentGrid,incidentFilters,incidentStatsCards,incidentDetailPanel} from '../components/admin-technical-incident.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Incidencias Técnicas','sync');
installAdminUserRoutes();

let currentFilters={};

async function load(){
  await scanAndLoad();
  bindFilters();
}

async function scanAndLoad(){
  await scanForIncidents();
  await loadIncidents(currentFilters);
  renderStats();
}

async function loadIncidents(filters){
  currentFilters=filters;
  const incidents=await getIncidents(filters);
  root.querySelector('#incidents-grid').innerHTML=incidentGrid(incidents);
  renderStats();
}

function renderStats(){
  getIncidentStats().then(stats=>{
    root.querySelector('#incident-stats').innerHTML=`
      <article class="stat-card total"><h3>Total</h3><strong>${stats.total}</strong></article>
      <article class="stat-card open"><h3>Abiertas</h3><strong>${stats.open}</strong></article>
      <article class="stat-card critical"><h3>Críticas</h3><strong>${stats.bySeverity?.critical||0}</strong></article>
      <article class="stat-card error"><h3>Errores</h3><strong>${stats.bySeverity?.error||0}</strong></article>
      <article class="stat-card warning"><h3>Advertencias</h3><strong>${stats.bySeverity?.warning||0}</strong></article>
      <article class="stat-card info"><h3>Informativas</h3><strong>${stats.bySeverity?.info||0}</strong></article>
    `;
  });
}

function bindFilters(){
  const form=root.querySelector('#incident-filters');
  form.onsubmit=e=>{e.preventDefault();loadIncidents(Object.fromEntries(new FormData(form)));};
  form.onreset=()=>setTimeout(()=>loadIncidents({}),0);
  
  root.querySelector('#scan-incidents').onclick=async()=>{
    const btn=root.querySelector('#scan-incidents');
    btn.disabled=true;
    btn.textContent='Escaneando...';
    await scanAndLoad();
    btn.disabled=false;
    btn.textContent='Escanear incidencias';
  };
  
  root.querySelector('#incidents-grid').onclick=async e=>{
    const btn=e.target.closest('[data-action]');
    if(!btn) return;
    const action=btn.dataset.action;
    const id=btn.dataset.id;
    if(action==='detail'){
      const inc=await getIncidentDetail(id);
      if(inc) open('Detalle de Incidencia',incidentDetailPanel(inc));
    }else if(action==='recheck'){
      await scanAndLoad();
    }else if(action==='resolve'){
      const resolution=prompt('Descripción de la resolución:');
      if(resolution){
        await markIncidentResolved(id,resolution);
        await loadIncidents(currentFilters);
      }
    }else if(action==='review'){
      await markIncidentReviewed(id);
      await loadIncidents(currentFilters);
    }
  };
}

load();
