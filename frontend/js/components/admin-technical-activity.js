import {esc} from './admin-dashboard-ui.js';
import {formatTechnicalDate,formatRelativeTime} from '../utils/technical-date-format.js';

export function technicalActivityCard(activity){
  const typeInfo=technicalActivityTypes.find(t=>t.id===activity.type)||{label:activity.type,icon:'activity'};
  const resultColors={
    success:'#10b981',
    warning:'#f59e0b',
    error:'#ef4444',
    unknown:'#6b7280',
  };
  return `
    <article class="activity-card" data-activity="${esc(activity.id)}">
      <header>
        <span class="activity-icon">${typeInfo.icon}</span>
        <span class="activity-type">${esc(typeInfo.label)}</span>
        <span class="activity-result" style="background:${resultColors[activity.result]||'#6b7280'}">${esc(activity.result)}</span>
      </header>
      <p class="activity-desc">${esc(activity.description)}</p>
      <div class="activity-meta">
        <span>${formatRelativeTime(activity.timestamp)}</span>
        <span>Origen: ${esc(activity.source)}</span>
        ${activity.reference?`<span>Ref: ${esc(activity.reference)}</span>`:''}
      </div>
      ${activity.metadata?`<pre class="activity-metadata">${esc(JSON.stringify(activity.metadata,null,2))}</pre>`:''}
    </article>
  `;
}

export function activityGrid(activities){
  return `<div class="activity-grid">${activities.map(technicalActivityCard).join('')}</div>`;
}

export function activityTable(activities){
  if(!activities.length) return '<p class="admin-empty">Sin actividad técnica registrada.</p>';
  return `
    <table class="activity-table">
      <thead>
        <tr><th>Tipo</th><th>Descripción</th><th>Resultado</th><th>Fecha</th><th>Origen</th><th>Referencia</th></tr>
      </thead>
      <tbody>
        ${activities.map(a=>`
          <tr>
            <td>${a.type}</td>
            <td>${esc(a.description)}</td>
            <td><span class="result-badge ${a.result}">${a.result}</span></td>
            <td>${new Date(a.timestamp).toLocaleString()}</td>
            <td>${esc(a.source)}</td>
            <td>${esc(a.reference||'—')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function activityFilters(filters){
  const typeOptions=[['','Todos'],['diagnostic-run','Diagnóstico ejecutado'],['package-validation','Validación de paquete'],['storage-error','Error de almacenamiento'],['state-change','Cambio de estado'],['sync-operation','Operación de sincronización'],['resource-check','Comprobación de recursos'],['pwa-diagnostic','Diagnóstico PWA'],['service-check','Comprobación de servicio'],['quality-check','Validación de calidad'],['incident-detected','Incidencia detectada'],['incident-resolved','Incidencia resuelta'],['config-change','Cambio de configuración'],['cache-cleared','Caché limpiada'],['db-upgrade','Actualización de BD']];
  const resultOptions=[['','Todos'],['success','Éxito'],['warning','Advertencia'],['error','Error'],['unknown','Desconocido']];
  const sourceOptions=[['','Todos'],['manual','Manual'],['auto','Automático'],['diagnostic','Diagnóstico'],['sync','Sincronización']];
  
  return `
    <form class="filter-card" id="activity-filters">
      <div class="filter-grid">
        <label class="field"><span>Tipo</span><select name="type">${typeOptions.map(([v,l])=>`<option value="${v}"${filters.type===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Resultado</span><select name="result">${resultOptions.map(([v,l])=>`<option value="${v}"${filters.result===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Origen</span><select name="source">${sourceOptions.map(([v,l])=>`<option value="${v}"${filters.source===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Desde</span><input type="date" name="from" value="${filters.from||''}"></label>
        <label class="field"><span>Hasta</span><input type="date" name="to" value="${filters.to||''}"></label>
        <label class="field field-search"><span>Buscar</span><input type="search" name="q" placeholder="Descripción o referencia"></label>
      </div>
      <div class="filter-actions"><button class="button-secondary" type="reset">Limpiar</button><button class="button-primary" type="submit">Filtrar</button></div>
    </form>
  `;
}

export function activityStatsCards(stats){
  return `
    <div class="activity-stats">
      <article class="stat-card"><h3>Total</h3><strong>${stats.total}</strong></article>
      <article class="stat-card"><h3>Últimas 24h</h3><strong>${stats.recent24h}</strong></article>
      ${Object.entries(stats.byType||{}).map(([t,c])=>`<article class="stat-card"><h3>${t}</h3><strong>${c}</strong></article>`).join('')}
    </div>
  `;
}

const technicalActivityTypes=[
  {id:'diagnostic-run',label:'Diagnóstico ejecutado',icon:'stethoscope'},
  {id:'package-validation',label:'Validación de paquete',icon:'shield-check'},
  {id:'storage-error',label:'Error de almacenamiento',icon:'alert-circle'},
  {id:'state-change',label:'Cambio de estado verificado',icon:'git-commit'},
  {id:'sync-operation',label:'Operación de sincronización',icon:'refresh-cw'},
  {id:'resource-check',label:'Comprobación de recursos',icon:'search'},
  {id:'pwa-diagnostic',label:'Diagnóstico PWA',icon:'monitor'},
  {id:'service-check',label:'Comprobación de servicio',icon:'activity'},
  {id:'quality-check',label:'Validación de calidad',icon:'clipboard-check'},
  {id:'incident-detected',label:'Incidencia detectada',icon:'alert-triangle'},
  {id:'incident-resolved',label:'Incidencia resuelta',icon:'check-circle'},
  {id:'config-change',label:'Cambio de configuración',icon:'settings'},
  {id:'cache-cleared',label:'Caché limpiada',icon:'trash'},
  {id:'db-upgrade',label:'Actualización de BD',icon:'database'},
];