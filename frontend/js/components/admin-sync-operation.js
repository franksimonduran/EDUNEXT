import {esc} from './admin-dashboard-ui.js';

export function operationTable(operations){
  if(!operations.length) return '<p class="admin-empty">No hay operaciones que coincidan con los filtros.</p>';
  return `
    <table class="operation-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tipo</th>
          <th>Entidad</th>
          <th>Estado</th>
          <th>Creada</th>
          <th>Último intento</th>
          <th>Intentos</th>
          <th>Error</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${operations.map(op=>`
          <tr data-op="${esc(op.opId)}">
            <td>${esc(op.opId)}</td>
            <td>${esc(formatOpType(op.type))}</td>
            <td>${esc(op.entity)}</td>
            <td><span class="status-badge ${op.status}">${esc(formatOpStatus(op.status))}</span></td>
            <td>${new Date(op.createdAt).toLocaleString()}</td>
            <td>${new Date(op.lastAttempt).toLocaleString()}</td>
            <td>${op.attempts}</td>
            <td>${op.lastError?esc(op.lastError):'—'}</td>
            <td>
              <button class="button-secondary" data-action="detail" data-op="${esc(op.opId)}">Detalle</button>
              <button type="button" disabled title="EDUNEXT Sync remoto sin integrar">Reintentar — sin integrar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function operationDetailPanel(op){
  return `
    <section class="operation-detail">
      <header>
        <h2>Detalle de Operación</h2>
        <span class="op-id">${esc(op.opId)}</span>
      </header>
      <dl>
        <dt>Tipo</dt><dd>${esc(formatOpType(op.type))}</dd>
        <dt>Entidad</dt><dd>${esc(op.entity)}</dd>
        <dt>Estado</dt><dd><span class="status-badge ${op.status}">${esc(formatOpStatus(op.status))}</span></dd>
        <dt>ID</dt><dd>${esc(op.opId)}</dd>
        <dt>Idempotencia</dt><dd>${esc(op.idempotencyKey)}</dd>
        <dt>Creada</dt><dd>${new Date(op.createdAt).toLocaleString()}</dd>
        <dt>Último intento</dt><dd>${new Date(op.lastAttempt).toLocaleString()}</dd>
        <dt>Intentos</dt><dd>${op.attempts}</dd>
        ${op.lastError?`<dt>Último error</dt><dd class="error-text">${esc(op.lastError)}</dd>`:''}
      </dl>
      <p>La carga útil se omite para proteger los datos académicos. Reintentos con servidor pendientes de integración.</p>
      ${op.history?.length?`
        <h3>Historial</h3>
        <ul class="history-list">
          ${op.history.map(h=>`<li>${new Date(h.timestamp).toLocaleString()}: ${esc(h.status)} ${h.message?'- '+esc(h.message):''}</li>`).join('')}
        </ul>
      `:''}
      <div class="detail-actions">
        <button class="button-secondary" data-action="close">Cerrar</button>
        <button type="button" disabled>Reintentar — sin integrar</button>
      </div>
    </section>
  `;
}

export function operationFilters(filters){
  const statusOptions=[['','Todos'],['pendiente','Pendiente'],['en-proceso','En proceso'],['error-temporal','Error temporal'],['confirmado','Confirmado']];
  const typeOptions=[['','Todos'],['draft-created','Borrador creado'],['proposal-created','Propuesta administrativa'],['review-completed','Revisión completada'],['evaluation-registered','Evaluación registrada'],['resource-added','Recurso agregado'],['validation-executed','Validación ejecutada'],['config-modified','Configuración modificada'],['package-downloaded','Paquete descargado'],['package-verified','Paquete verificado'],['sync-attempted','Intento de sincronización']];
  return `
    <form class="filter-card" id="op-filters">
      <div class="filter-grid">
        <label class="field"><span>Estado</span><select name="status">${statusOptions.map(([v,l])=>`<option value="${v}"${filters.status===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Tipo</span><select name="type">${typeOptions.map(([v,l])=>`<option value="${v}"${filters.type===v?' selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Desde</span><input type="date" name="from" value="${esc(filters.from||'')}"></label>
        <label class="field"><span>Hasta</span><input type="date" name="to" value="${esc(filters.to||'')}"></label>
      </div>
      <div class="filter-actions">
        <button class="button-secondary" type="reset">Limpiar</button>
        <button class="button-primary" type="submit">Filtrar</button>
      </div>
    </form>
  `;
}

function formatOpType(type){
  const types={
    'draft-created':'Borrador creado',
    'proposal-created':'Propuesta administrativa',
    'review-completed':'Revisión completada',
    'evaluation-registered':'Evaluación registrada',
    'resource-added':'Recurso agregado',
    'validation-executed':'Validación ejecutada',
    'config-modified':'Configuración modificada',
    'package-downloaded':'Paquete descargado',
    'package-verified':'Paquete verificado',
    'sync-attempted':'Intento de sincronización',
  };
  return types[type]||type;
}

function formatOpStatus(status){
  const labels={pendiente:'Pendiente','en-proceso':'En proceso','error-temporal':'Error temporal',confirmado:'Confirmado'};
  return labels[status]||status;
}
