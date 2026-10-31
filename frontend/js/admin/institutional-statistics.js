import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {generateStatisticsReport} from '../services/admin-institutional-reports.service.js';
import {comparePeriods} from '../services/admin-statistics.service.js';
import {reportPreview} from '../components/admin-report-preview.js';
import {exportReportCSV,showExportModal,downloadCSV} from '../components/admin-report-export.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Estadísticas Institucionales','reports');
installAdminUserRoutes();

let currentReport=null;
let currentConfig={periodA:'2026-1',periodB:'2026-2',grade:'all',room:'all',course:'all'};

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
    let report;
    if(config.compare===true){
      report=await comparePeriods(config.periodA,config.periodB,{grade:config.grade,room:config.room,course:config.course});
    }else{
      report=await import('../services/admin-institutional-reports.service.js').then(m=>m.generateStatisticsReport({period:config.periodA,grade:config.grade,room:config.room,course:config.course}));
    }
    currentReport=report;
    renderPreview(report,config);
  }catch(err){open('Error',`<p>${esc(err.message)}</p>`);}
}

function renderPreview(report,config){
  root.querySelector('#report-preview').innerHTML=reportPreview(report,{...config,name:'Estadísticas Institucionales',type:'statistics'});
  root.querySelector('#preview-date').textContent=new Date().toLocaleString('es');
  bindActions(report,config);
}

function bindActions(report,config){
  const printBtn=root.querySelector('#print-report');
  if(printBtn)printBtn.onclick=()=>window.print();
  const exportBtn=root.querySelector('#export-csv');
  if(exportBtn)exportBtn.onclick=()=>{showExportModal(()=>{const csv=exportReportCSV(report,{...config,name:'Estadísticas Institucionales',type:'statistics'});downloadCSV(csv,`estadisticas-${config.periodA}-${Date.now()}.csv`);});};
  const compareBtn=root.querySelector('#compare-periods');
  if(compareBtn)compareBtn.onclick=async()=>{const pA=root.querySelector('[name="periodA"]').value;const pB=root.querySelector('[name="periodB"]').value;if(pA&&pB&&pA!==pB){currentConfig={...currentConfig,periodA:pA,periodB:pB};await generateReport(currentConfig);}else{open('Comparación','<p>Seleccione dos periodos distintos.</p>');}};
}

load();
