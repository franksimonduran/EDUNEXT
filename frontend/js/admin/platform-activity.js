import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {getPlatformActivity} from '../services/admin-platform-activity.service.js';
import {reportPreview} from '../components/admin-report-preview.js';
import {exportReportCSV,showExportModal,downloadCSV} from '../components/admin-report-export.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Actividad de la Plataforma','reports');
installAdminUserRoutes();

let currentReport=null;
let currentConfig={period:'2026-1',type:'',state:'',owner:'',dateFrom:'',dateTo:''};

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
    const report=await getPlatformActivity({period:config.period,type:config.type,state:config.state,owner:config.owner,dateFrom:config.dateFrom,dateTo:config.dateTo});
    currentReport=report;
    renderPreview(report,config);
  }catch(err){open('Error',`<p>${esc(err.message)}</p>`);}
}

function renderPreview(report,config){
  root.querySelector('#report-preview').innerHTML=reportPreview(report,{...config,name:'Actividad de la Plataforma',type:'activity'});
  root.querySelector('#preview-date').textContent=new Date().toLocaleString('es');
  bindActions(report,config);
}

function bindActions(report,config){
  const exportBtn=root.querySelector('#export-csv');
  if(exportBtn)exportBtn.onclick=()=>{showExportModal(()=>{const csv=exportReportCSV(report,{...config,name:'Actividad de la Plataforma',type:'activity'});downloadCSV(csv,`actividad-${config.period}-${Date.now()}.csv`);});};
}

load();