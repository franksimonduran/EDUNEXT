import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {getTechnicalActivity,getActivityStats} from '../services/admin-technical-activity.service.js';
import {technicalActivityCard,activityGrid,activityFilters,activityStatsCards} from '../components/admin-technical-activity.js';
import {generateTechnicalSummary,formatSummaryForDisplay,generateSafeJSON,downloadTextFile,copyToClipboard,collectTechnicalSummary} from '../utils/safe-technical-export.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Actividad Técnica Local','sync');
installAdminUserRoutes();

let currentFilters={};

async function load(){
  await loadActivity(currentFilters);
  bindFilters();
}

async function loadActivity(filters){
  currentFilters=filters;
  const [activities,stats]=await Promise.all([getTechnicalActivity(filters),getActivityStats()]);
  root.querySelector('#activity-grid').innerHTML=activityGrid(activities);
  root.querySelector('#activity-stats').innerHTML=activityStatsCards(stats);
}

function bindFilters(){
  const form=root.querySelector('#activity-filters');
  form.onsubmit=e=>{e.preventDefault();loadActivity(Object.fromEntries(new FormData(form)));};
  form.onreset=()=>setTimeout(()=>loadActivity({}),0);
  
  root.querySelector('#export-report').onclick=async()=>{
    const btn=root.querySelector('#export-report');
    btn.disabled=true;
    btn.textContent='Generando...';
    const report=await collectTechnicalSummary();
    const summary=formatSummaryForDisplay(report);
    downloadTextFile(summary,`edunext-tech-summary-${Date.now()}.txt`);
    btn.disabled=false;
    btn.textContent='Exportar resumen';
  };
  
  // Also add a button for JSON export
  const exportBtn=document.createElement('button');
  exportBtn.className='button-secondary';
  exportBtn.textContent='Exportar JSON';
  exportBtn.onclick=async()=>{
    const report=await collectTechnicalSummary();
    const json=generateSafeJSON(report);
    downloadTextFile(json,`edunext-tech-summary-${Date.now()}.json`);
  };
  root.querySelector('.page-actions').appendChild(exportBtn);
}

load();