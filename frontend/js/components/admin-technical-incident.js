import {esc} from './admin-dashboard-ui.js';
import {formatTechnicalDate,formatRelativeTime} from '../utils/technical-date-format.js';
import {getSeverityInfo} from '../data/admin-system-status-descriptions.data.js';

export function technicalIncidentCard(incident){
  const sevInfo=getSeverityInfo(incident.severity);
  return `
    <article class="incident-card ${incident.severity} ${incident.status}" data-incident="${esc(incident.id)}">
      <header>
        <h3>${esc(incident.title)}</h3>
        <div class="incident-badges">
          <span class="severity-badge" style="background:${sevInfo.color}">${esc(sevInfo.label)}</span>
          <span class="category-badge">${esc(incident.category)}</span>
          <span class="status-badge ${incident.status}">${esc(incident.status)}</span>
        </div>
      </header>
      <p class="incident-desc">${esc(incident.description)}</p>
      <dl class="incident-meta">
        <dt>ID</dt><dd>${esc(incident.id)}</dd>
        <dt>Regla</dt><dd>${esc(incident.rule)}</dd>
        <dt>Primera detección</dt><dd>${formatTechnicalDate(incident.detectedAt)}</dd>
        <dt>Última detección</dt><dd>${formatTechnicalDate(incident.lastDetectedAt)}</dd>
        <dt>Repeticiones</dt><dd>${incident.count||1}</dd>
        <dt>Revisada</dt><dd>${incident.reviewed?'Sí':'No'}</dd>
        ${incident.resolvedAt?`<dt>Resuelta</dt><dd>${formatTechnicalDate(incident.resolvedAt)}</dd>`:''}
      </dl>
      ${incident.resolution?`<p class="resolution"><strong>Resolución:</strong> ${esc(incident.resolution)}</p>`:''}
      <div class="incident-actions">
        <button class="button-secondary" data-action="detail" data-id="${esc(incident.id)}">Detalle</button>
        <button class="button-secondary" data-action="recheck" data-id="${esc(incident.id)}">Reverificar</button>
        <p>La revisión local no resuelve la incidencia; hace falta evidencia de una nueva comprobación.</p>
        <button class="button-secondary" data-action="review" data-id="${esc(incident.id)}">${incident.reviewed?'Revisada':'Marcar revisada'}</button>
      </div>
    </article>
  `;
}

export function incidentGrid(incidents){
  return `<div class="incident-grid">${incidents.map(technicalIncidentCard).join('')}</div>`;
}

export function incidentFilters(filters){
  const categoryOptions=[['','Todas'],['storage','Almacenamiento'],['serviceWorker','Service Worker'],['cacheStorage','Cache Storage'],['offlineResources','Recursos Offline'],['syncOperations','Operaciones de Sincronización'],['compatibility','Compatibilidad'],['versions','Versiones'],['integration','Integración'],['resourceErrors','Errores de Recursos'],['diagnostics','Diagnósticos'],['quality','Calidad de Datos']];
  const severityOptions=[['','Todas'],['critical','Crítica'],['error','Error'],['warning','Advertencia'],['info','Informativa']];
  const statusOptions=[['','Todos'],['open','Abierta'],['reviewed','Revisada'],['resolved','Resuelta'],['reopened','Reabierta']];
  
  return `
    <form class="filter-card" id="incident-filters">
      <div class="filter-grid">
        <label class="field"><span>Categoría</span><select name="category">${categoryOptions.map(([v,l])=>`<option value="${v}"${filters.category===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Severidad</span><select name="severity">${severityOptions.map(([v,l])=>`<option value="${v}"${filters.severity===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Estado</span><select name="status">${statusOptions.map(([v,l])=>`<option value="${v}"${filters.status===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Desde</span><input type="date" name="from" value="${filters.from||''}"></label>
        <label class="field"><span>Hasta</span><input type="date" name="to" value="${filters.to||''}"></label>
        <label class="field field-search"><span>Buscar</span><input type="search" name="q" placeholder="ID, título o descripción"></label>
      </div>
      <div class="filter-actions">
        <button class="button-secondary" type="reset">Limpiar</button>
        <button class="button-primary" type="submit">Filtrar</button>
      </div>
    </form>
  `;
}

export function incidentStatsCards(stats){
  return `
    <div class="incident-stats">
      <article class="stat-card total"><h3>Total</h3><strong>${stats.total}</strong></article>
      <article class="stat-card open"><h3>Abiertas</h3><strong>${stats.open}</strong></article>
      <article class="stat-card critical"><h3>Críticas</h3><strong>${stats.bySeverity?.critical||0}</strong></article>
      <article class="stat-card error"><h3>Errores</h3><strong>${stats.bySeverity?.error||0}</strong></article>
      <article class="stat-card warning"><h3>Advertencias</h3><strong>${stats.bySeverity?.warning||0}</strong></article>
      <article class="stat-card info"><h3>Informativas</h3><strong>${stats.bySeverity?.info||0}</strong></article>
    </div>
  `;
}

export function incidentDetailPanel(incident){
  const sevInfo=incident.severity;
  return `
    <section class="incident-detail">
      <header>
        <h2>${esc(incident.title)}</h2>
        <div class="detail-badges">
          <span class="severity-badge ${incident.severity}">${incident.severity}</span>
          <span class="category-badge">${incident.category}</span>
          <span class="status-badge ${incident.status}">${incident.status}</span>
        </div>
      </header>
      <p class="description">${esc(incident.description)}</p>
      <dl>
        <dt>ID</dt><dd>${esc(incident.id)}</dd>
        <dt>Categoría</dt><dd>${esc(incident.category)}</dd>
        <dt>Regla</dt><dd>${esc(incident.rule)}</dd>
        <dt>Severidad</dt><dd>${esc(incident.severity)}</dd>
        <dt>Fuente</dt><dd>${esc(incident.source)}</dd>
        <dt>Primera detección</dt><dd>${formatTechnicalDate(incident.detectedAt)}</dd>
        <dt>Última detección</dt><dd>${formatTechnicalDate(incident.lastDetectedAt)}</dd>
        <dt>Repeticiones</dt><dd>${incident.count||1}</dd>
        <dt>Revisada</dt><dd>${incident.reviewed?'Sí':'No'}</dd>
        <dt>Estado</dt><dd>${incident.status}</dd>
        ${incident.resolvedAt?`<dt>Resuelta</dt><dd>${formatTechnicalDate(incident.resolvedAt)}</dd>`:''}
        ${incident.resolution?`<dt>Resolución</dt><dd>${esc(incident.resolution)}</dd>`:''}
      </dl>
      <div class="detail-actions">
        <button class="button-secondary" data-action="close">Cerrar</button>
        <button class="button-secondary" data-action="recheck" data-id="${esc(incident.id)}">Reverificar</button>
        <p>Sin resolución manual: requiere nueva comprobación.</p>
        <button class="button-secondary" data-action="review" data-id="${esc(incident.id)}">${incident.reviewed?'Revisada':'Marcar revisada'}</button>
      </div>
    </section>
  `;
}
