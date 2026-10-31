import {adminShell} from './admin-shell.js';
import {reportTypeGrid,reportTypes} from '../components/admin-report-card.js';
import {reportConfigForm,bindConfigForm} from '../components/admin-report-filters.js';
import {listReportConfigs,saveReportConfig} from '../services/admin-reports.service.js';
import {authorizedRooms} from '../services/monitor-students.service.js';
import {esc} from '../components/admin-dashboard-ui.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {renderReportsApi} from '../components/reports-api-view.js';
const {root,open}=adminShell('Reportes Institucionales','reports');
if(useProgressApi()){
 const network=root.querySelector('#admin-network'),title=root.querySelector('#admin-title');
 const host=document.createElement('section');root.replaceChildren(...[network,title,host].filter(Boolean));
 if(network)network.textContent='Modo API · Consulta de reportes autorizados';
 renderReportsApi(host,'institution');
}else{
const paths={institutional:'reporte-institucional',grade:'reporte-grado',classroom:'reporte-aula',course:'reporte-curso',statistics:'estadisticas-institucionales',monitoring:'seguimiento-academico',quality:'calidad-datos',activity:'actividad-plataforma',history:'historial-reportes'};
root.querySelector('#report-types-grid').innerHTML=reportTypeGrid(reportTypes.map(t=>t.id));
root.querySelector('#report-types-grid').onclick=e=>{const b=e.target.closest('[data-type]');if(!b)return;const type=b.dataset.type;if(['quality','activity','history'].includes(type)){location.assign(paths[type]+'.html');return;}root.querySelector('#config-section').hidden=false;root.querySelector('.report-types-section').hidden=true;const container=root.querySelector('#config-form-container');container.innerHTML=reportConfigForm({type,period:'all',grade:'4',room:'a4',course:'math',showTables:true,showCharts:true},authorizedRooms());bindConfigForm(container,c=>open('Configuración local','<p>La generación comprobará institución, periodo, grado, aula y asignatura contra las fuentes compartidas.</p>'),async c=>{try{const {generateInstitutionalReport}=await import('../services/admin-institutional-reports.service.js');const filters={period:c.period||'all',grade:c.grade||'all',room:c.room||'all',course:c.course||'all'};await generateInstitutionalReport(filters);await saveReportConfig({...c,...filters});location.assign(paths[c.type]+'.html?'+new URLSearchParams(filters));}catch(error){open('No se pudo preparar',`<p>${esc(error.message)}</p>`);}});};
root.querySelector('#back-to-types').onclick=()=>{root.querySelector('#config-section').hidden=true;root.querySelector('.report-types-section').hidden=false;};
listReportConfigs().then(c=>root.querySelector('#reports-summary').textContent=reportTypes.length+' plantillas implementadas · '+c.length+' configuraciones guardadas localmente. Disponibilidad académica parcial.').catch(e=>open('Almacenamiento no disponible',`<p>${esc(e.message)}</p>`));
}
