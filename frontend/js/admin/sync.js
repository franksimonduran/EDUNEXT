import {adminShell} from './admin-shell.js';
import {getSyncStatus} from '../services/admin-sync.service.js';
import {checkAllServices} from '../services/admin-services-status.service.js';
import {syncSummaryCard,serviceStatusCard} from '../components/admin-sync-summary.js';
import {esc} from '../components/admin-dashboard-ui.js';
import {onConnectivityChange} from '../offline/connectivity.js';
const {root}=adminShell('EDUNEXT Sync — Centro de Control','sync');
async function load(){try{const [status,services]=await Promise.all([getSyncStatus(),checkAllServices()]);root.querySelector('#sync-summary').innerHTML=syncSummaryCard(status);root.querySelector('#sync-metrics').innerHTML=services.map(serviceStatusCard).join('');}catch(e){root.querySelector('#sync-summary').innerHTML='<p role="alert">'+esc(e.message)+'</p>';}}
onConnectivityChange(load);load();
