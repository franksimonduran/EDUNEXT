import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {getStorageSummary,getIndexedDBDetail,getStorageUsageByStore,getStorageMetadata} from '../services/admin-storage-diagnostics.service.js';
import {storageSummaryCard,indexedDBDetailPanel,storageUsageGrid,storageMetadataPanel,storageLimitationsList} from '../components/admin-storage-summary.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Almacenamiento Local','sync');
installAdminUserRoutes();

async function load(){
  await loadSummary();
  bindActions();
}

async function loadSummary(){
  const summary=await getStorageSummary();
  root.querySelector('#storage-summary').innerHTML=storageSummaryCard(summary);
  root.querySelector('#idb-detail').innerHTML=indexedDBDetailPanel(await getIndexedDBDetail());
  root.querySelector('#usage-detail').innerHTML=storageUsageGrid(await getStorageUsageByStore());
  root.querySelector('#meta-detail').innerHTML=storageMetadataPanel(await getStorageMetadata());
}

function bindActions(){
  root.querySelector('#refresh-storage').onclick=async()=>{
    const btn=root.querySelector('#refresh-storage');
    btn.disabled=true;
    btn.textContent='Actualizando...';
    await loadSummary();
    btn.disabled=false;
    btn.textContent='Actualizar';
  };
}

load();