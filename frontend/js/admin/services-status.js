import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {checkAllServices,getServiceDetail,getServiceDefinitions,getServiceCategories} from '../services/admin-services-status.service.js';
import {serviceGrid,serviceCategoriesGrid} from '../components/admin-service-status.js';
import {at,esc} from '../components/admin-dashboard-ui.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {renderAIConfigurationPanel} from '../components/ai-configuration-panel.js';

const {root,open}=adminShell('Estado de Servicios','services');
installAdminUserRoutes();

async function load(){
  renderCategories();
  bindActions();
  await runChecks();
}

function renderCategories(){
  const cats=getServiceCategories();
  const container=root.querySelector('#services-grid');
  container.innerHTML=serviceCategoriesGrid(cats);
}

async function runChecks(){
  const results=await checkAllServices();
  const container=root.querySelector('#services-grid');
  container.innerHTML=results.map(r=>`<article class="service-card" data-service="${r.id}" data-state="${r.state}"><header><h3>${r.name}</h3><span class="service-type">${r.type}</span></header><div class="service-status"><span class="status-badge" style="background:${({available:'#10b981',unavailable:'#ef4444',pending:'#f59e0b','not-integrated':'#6b7280',unknown:'#9ca3af','locally-available':'#3b82f6',error:'#ef4444','not-configured':'#6b7280'})[r.state]||'#9ca3af'}">${({available:'Disponible',unavailable:'No disponible',pending:'Pendiente','not-integrated':'Sin integrar',unknown:'Desconocido','locally-available':'Disponible localmente',error:'Error','not-configured':'Sin configurar'})[r.state]||r.state}</span></div><p class="service-desc">${r.description}</p><div class="service-meta"><span>Método: ${r.method}</span><span>Duración: ${r.duration}ms</span><span class="evidence">${r.evidence||'—'}</span></div>${r.message?`<p class="service-message">${r.message}</p>`:''}<div class="service-footer"><span class="checked-at">Comprobado: ${new Date(r.checkedAt).toLocaleString()}</span><span class="integration ${r.integrated?'integrated':'not-integrated'}">${r.integrated?'Integrado':'Sin integrar'}</span></div></article>`).join('');
}

function bindActions(){
  root.querySelector('#check-services').onclick=async()=>{
    const btn=root.querySelector('#check-services');
    btn.disabled=true;
    btn.textContent='Comprobando...';
    await runChecks();
    btn.disabled=false;
    btn.textContent='Comprobar todo';
  };
}

if(useProgressApi()){
 const network=root.querySelector('#admin-network'),title=root.querySelector('#admin-title'),host=document.createElement('section');
 root.replaceChildren(...[network,title,host].filter(Boolean));
 if(network)network.textContent='Modo API · Configuración institucional IA';
 renderAIConfigurationPanel(host);
}else load();
