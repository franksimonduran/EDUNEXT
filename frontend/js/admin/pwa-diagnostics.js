import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {runPWADiagnostics,getPWASummary,getSWDetail,getManifestDetail,getCacheDetail} from '../services/admin-pwa-diagnostics.service.js';
import {pwaStatusCard,pwaDetailPanels,swDetailPanel,manifestDetailPanel,cacheDetailPanel} from '../components/admin-pwa-status.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Diagnóstico PWA','sync');
installAdminUserRoutes();

async function load(){
  renderSummary();
  bindActions();
  await runDiag();
}

function renderSummary(){
  root.querySelector('#pwa-summary').innerHTML=pwaStatusCard({
    serviceWorker:true,
    swRegistered:false,
    swControlling:false,
    manifest:false,
    manifestValid:false,
    cacheStorage:false,
    installable:false,
    standalone:false,
    offlineReady:false,
  });
}

async function runDiag(){
  const btn=root.querySelector('#run-pwa-diag');
  btn.disabled=true;
  btn.textContent='Ejecutando...';
  const results=await runPWADiagnostics();
  const summary=await getPWASummary();
  const swDetail=await getSWDetail();
  const manifestDetail=await getManifestDetail();
  const cacheDetail=await getCacheDetail();
  
  root.querySelector('#pwa-summary').innerHTML=pwaStatusCard({
    serviceWorker:true,
    swRegistered:summary.swRegistered,
    swControlling:summary.swControlling,
    manifest:summary.manifestValid,
    manifestValid:summary.manifestValid,
    cacheStorage:summary.cacheAvailable,
    installable:summary.installable,
    standalone:summary.standalone,
    offlineReady:summary.offlineReady,
  });
  
  root.querySelector('#pwa-panels').innerHTML=`
    ${pwaDetailPanels({...summary,swActive:swDetail.active,swScope:swDetail.scope,swControling:swDetail.controlling})}
    ${swDetailPanel(swDetail)}
    ${manifestDetailPanel(manifestDetail)}
    ${cacheDetailPanel(cacheDetail)}
  `;
  btn.disabled=false;btn.textContent='Ejecutar diagnóstico';
}

function bindActions(){
  root.querySelector('#run-pwa-diag').onclick=async()=>{
    const btn=root.querySelector('#run-pwa-diag');
    btn.disabled=true;
    btn.textContent='Ejecutando...';
    await runDiag();
    btn.disabled=false;
    btn.textContent='Ejecutar diagnóstico';
  };
}

load();
