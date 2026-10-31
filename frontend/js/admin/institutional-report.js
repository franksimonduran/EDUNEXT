import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {generateInstitutionalReport} from '../services/admin-institutional-reports.service.js';
import {reportPreview} from '../components/admin-report-preview.js';
import {exportReportCSV,showExportModal,downloadCSV} from '../components/admin-report-export.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Reporte Institucional','reports');
installAdminUserRoutes();

let currentReport=null;
let currentConfig={period:'2026-1',grade:'all',room:'all',course:'all',...Object.fromEntries(new URLSearchParams(location.search))};

async function load(){
  bindFilters();
  await generateReport(currentConfig);
}

function bindFilters(){
  const form=root.querySelector('#report-filters');
  form.onsubmit=e=>{e.preventDefault();currentConfig=Object.fromEntries(new FormData(form));generateReport(currentConfig);};
  form.onreset=()=>{setTimeout(()=>{const r=root.querySelector('[name="room"]');if(r)r.innerHTML='<option value="all">Todas</option>';},0);};
}

async function generateReport(config){
  try{
    const report=await generateInstitutionalReport({period:config.period,grade:config.grade,room:config.room,course:config.course});
    currentReport=report;
    renderPreview(report,config);
  }catch(err){open('Error',`<p>${esc(err.message)}</p>`);}
}

function renderPreview(report,config){
  root.querySelector('#report-preview').innerHTML=reportPreview(report,{...config,name:'Reporte Institucional',type:'institutional'});
  root.querySelector('#preview-date').textContent=new Date().toLocaleString('es');
  bindActions(report,config);
}

function bindActions(report,config){
  const printBtn=root.querySelector('#print-report');
  if(printBtn)printBtn.onclick=()=>window.print();
  const exportBtn=root.querySelector('#export-csv');
  if(exportBtn)exportBtn.onclick=()=>{showExportModal(()=>{const csv=exportReportCSV(report,{...config,name:'Reporte Institucional',type:'institutional'});downloadCSV(csv,`institucional-${config.period}-${Date.now()}.csv`);});};
}

load();
