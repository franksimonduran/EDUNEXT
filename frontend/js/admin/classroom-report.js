import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {generateClassroomReport} from '../services/admin-institutional-reports.service.js';
import {reportPreview} from '../components/admin-report-preview.js';
import {exportReportCSV,showExportModal,downloadCSV} from '../components/admin-report-export.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Reporte por Aula','reports');
installAdminUserRoutes();

let currentReport=null;
let currentConfig={period:'2026-1',grade:'4',room:'a4',course:'all',...Object.fromEntries(new URLSearchParams(location.search))};

async function load(){
  bindFilters();
  await generateReport(currentConfig);
}

function bindFilters(){
  const form=root.querySelector('#report-filters');
  form.onsubmit=e=>{e.preventDefault();currentConfig=Object.fromEntries(new FormData(form));generateReport(currentConfig);};
  form.onreset=()=>{setTimeout(()=>{const r=root.querySelector('[name="room"]');if(r)r.innerHTML='<option value="a4">Aula 4ºA</option><option value="a5">Aula 5ºA</option><option value="a6">Aula 6ºA</option>';},0);};
}

async function generateReport(config){
  try{
    const report=await generateClassroomReport(config.room,{period:config.period,grade:config.grade,course:config.course});
    if(!report){open('No encontrado',`<p>Aula no disponible.</p>`);return;}
    currentReport=report;
    renderPreview(report,config);
  }catch(err){open('Error',`<p>${esc(err.message)}</p>`);}
}

function renderPreview(report,config){
  root.querySelector('#report-preview').innerHTML=reportPreview(report,{...config,name:'Reporte por Aula',type:'classroom'});
  root.querySelector('#preview-date').textContent=new Date().toLocaleString('es');
  bindActions(report,config);
}

function bindActions(report,config){
  const printBtn=root.querySelector('#print-report');
  if(printBtn)printBtn.onclick=()=>window.print();
  const exportBtn=root.querySelector('#export-csv');
  if(exportBtn)exportBtn.onclick=()=>{showExportModal(()=>{const csv=exportReportCSV(report,{...config,name:'Reporte por Aula',type:'classroom'});downloadCSV(csv,`aula-${config.room}-${config.period}-${Date.now()}.csv`);});};
}

load();
