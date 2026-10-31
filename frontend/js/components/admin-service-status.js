import {esc} from './admin-dashboard-ui.js';
import {getStateColor,ServiceState} from '../utils/service-status-normalization.js';

export function serviceStatusCard(service){
  const info=service.state?{label:service.state,color:getStateColor(service.state)}:{label:'unknown',color:'#9ca3af'};
  const state=service.state||'unknown';
  return `
    <article class="service-card" data-service="${esc(service.id)}" data-state="${esc(state)}">
      <header>
        <h3>${esc(service.name)}</h3>
        <span class="service-type">${esc(service.type)}</span>
      </header>
      <div class="service-status">
        <span class="status-badge" style="background:${getStateColor(state)}">${esc(formatStatusLabel(state))}</span>
      </div>
      <p class="service-desc">${esc(service.description)}</p>
      <div class="service-meta">
        <span>Método: ${esc(service.method)}</span>
        <span>Duración: ${service.duration}ms</span>
        <span class="evidence">${esc(service.evidence||'—')}</span>
      </div>
      ${service.message?`<p class="service-message">${esc(service.message)}</p>`:''}
      <div class="service-footer">
        <span class="checked-at">Comprobado: ${new Date(service.checkedAt).toLocaleString()}</span>
        <span class="integration ${service.integrated?'integrated':'not-integrated'}">
          ${service.integrated?'Integrado':'Sin integrar'}
        </span>
      </div>
    </article>
  `;
}

export function serviceGrid(services){
  return `<div class="service-grid">${services.map(serviceStatusCard).join('')}</div>`;
}

export function serviceCategoriesGrid(categories){
  return Object.entries(categories).map(([cat,services])=>
    `<section class="service-category">
      <h3>${esc(cat)}</h3>
      <div class="service-grid">${services.map(serviceStatusCard).join('')}</div>
    </section>`
  ).join('');
}

function formatStatusLabel(state){
  const labels={
    available:'Disponible',
    unavailable:'No disponible',
    pending:'Pendiente',
    'not-integrated':'Sin integrar',
    unknown:'Desconocido',
    'locally-available':'Disponible localmente',
    error:'Error',
    'not-configured':'Sin configurar',
  };
  return labels[state]||state;
}
