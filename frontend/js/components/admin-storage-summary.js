import {esc} from './admin-dashboard-ui.js';
import {formatBytes} from '../utils/storage-estimate.js';

export function storageSummaryCard(data){
  const est=data.estimate;
  const pct=est.percentUsed;
  const warn=pct!=='?' && parseFloat(pct)>=80;
  return `
    <article class="storage-summary-card ${warn?'warning':''}">
      <header>
        <h2>Almacenamiento Local</h2>
        <span class="storage-percent ${warn?'high':''}">${esc(pct)}%</span>
      </header>
      <dl class="storage-stats">
        <dt>Uso</dt><dd>${esc(est.usedMB)} MB</dd>
        <dt>Cuota</dt><dd>${esc(est.quotaMB)} MB</dd>
        <dt>Porcentaje</dt><dd>${esc(est.percentUsed)}%</dd>
        <dt>Persistencia</dt><dd>${data.persistence?.persisted?'Activa':'Inactiva'}</dd>
      </dl>
      <div class="storage-bar">
        <div class="storage-bar-fill" style="width:${typeof est.percentUsed==='number'?est.percentUsed:0}%"></div>
      </div>
      <p class="storage-limitations">${(data.limitations||[]).join('; ')}</p>
    </article>
  `;
}

export function indexedDBDetailPanel(data){
  if(!data.stores) return '<p class="muted">No hay información de almacenes.</p>';
  return `
    <section class="idb-detail">
      <h3>IndexedDB (v${data.database?.version||'?'})</h3>
      <p>Almacenes: ${data.database?.stores||0}</p>
      <table class="store-table">
        <thead><tr><th>Almacén</th><th>Registros</th><th>Privacidad</th></tr></thead>
        <tbody>
          ${Object.entries(data.stores).map(([name,info])=>
            `<tr><td>${esc(name)}</td><td>${info.count}</td><td>Contenido de registros omitido</td></tr>`
          ).join('')}
        </tbody>
      </table>
    </section>
  `;
}

export function storageUsageGrid(usage){
  if(!usage) return '<p class="muted">Sin datos de uso.</p>';
  return `
    <section class="usage-grid">
      <h3>Uso por almacén</h3>
      <table class="usage-table">
        <thead><tr><th>Almacén</th><th>Registros</th><th>Tamaño aprox.</th></tr></thead>
        <tbody>
          ${Object.entries(usage).map(([name,info])=>
            `<tr><td>${name}</td><td>${info.count}</td><td>${info.approxKB} KB</td></tr>`
          ).join('')}
        </tbody>
      </table>
    </section>
  `;
}

export function storageMetadataPanel(meta){
  if(!meta||!Object.keys(meta).length) return '<p class="muted">Sin metadatos de almacenamiento.</p>';
  return `
    <section class="storage-meta">
      <h3>Metadatos de almacenamiento</h3>
      <dl>
        ${Object.entries(meta).map(([k,v])=>`<dt>${k}</dt><dd>${JSON.stringify(v)}</dd>`).join('')}
      </dl>
    </section>
  `;
}

export function storageLimitationsList(limitations){
  return `<ul class="limitations-list">${(limitations||[]).map(l=>`<li>${l}</li>`).join('')}</ul>`;
}
