import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {runQualityChecks} from '../services/admin-data-quality.service.js';
import {reportPreview} from '../components/admin-report-preview.js';
import {exportReportCSV,showExportModal,downloadCSV} from '../components/admin-report-export.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Calidad de Datos','reports');
installAdminUserRoutes();

let currentReport=null;
let currentConfig={period:'2026-1',grade:'all',room:'all',course:'all'};

async function load(){
  bindFilters();
}

function bindFilters(){
  const form=root.querySelector('#report-filters');
  form.onsubmit=e=>{e.preventDefault();currentConfig=Object.fromEntries(new FormData(form));};
  form.onreset=()=>{setTimeout(()=>{const r=root.querySelector('[name="room"]');if(r)r.innerHTML='<option value="all">Todas</option>';},0);};
  root.querySelector('#run-checks').onclick=async()=>{currentConfig=Object.fromEntries(new FormData(root.querySelector('#report-filters')));await generateReport(currentConfig);};
}

async function generateReport(config){
  try{
    const report=await runQualityChecks({period:config.period,grade:config.grade,room:config.room,course:config.course});
    currentReport=report;
    renderPreview(report,config);
  }catch(err){open('Error',`<p>${esc(err.message)}</p>`);}
}

function renderPreview(report,config){
  root.querySelector('#report-preview').innerHTML=reportPreview(report,{...config,name:'Calidad de Datos',type:'quality'});
  root.querySelector('#preview-date').textContent=new Date().toLocaleString('es');
  bindActions(report,config);
}

function bindActions(report,config){
  const exportBtn=root.querySelector('#export-csv');
  if(exportBtn)exportBtn.onclick=()=>{showExportModal(()=>{const csv=exportReportCSV(report,{...config,name:'Calidad de Datos',type:'quality'});downloadCSV(csv,`calidad-${config.period}-${Date.now()}.csv`);});};
}

load();