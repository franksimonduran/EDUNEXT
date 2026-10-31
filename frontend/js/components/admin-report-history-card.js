import {esc,date} from './admin-dashboard-ui.js';

export function historyCard(item,{onOpen,onDuplicate,onDelete}={}){
  const isConfig=item.source==='config';
  return `
    <article class="history-card" data-id="${esc(item.id)}" data-source="${esc(item.source)}">
      <header>
        <h3>${esc(item.displayName)}</h3>
        <span class="source-badge ${isConfig?'config':'history'}">${isConfig?'Configuración':'Generado'}</span>
      </header>
      <dl class="history-meta">
        <dt>Tipo</dt><dd>${esc(item.type||'—')}</dd>
        <dt>Periodo</dt><dd>${esc(item.filters?.period||'—')}</dd>
        <dt>Grado</dt><dd>${esc(item.filters?.grade||'—')}</dd>
        <dt>Aula</dt><dd>${esc(item.filters?.room||'—')}</dd>
        <dt>Asignatura</dt><dd>${esc(item.filters?.course||'—')}</dd>
        <dt>Fecha</dt><dd>${date(item.updatedAt||item.createdAt)}</dd>
      </dl>
      <div class="history-actions">
        ${onOpen?`<button class="button-secondary" type="button" data-action="open">Abrir</button>`:''}
        ${onDuplicate?`<button class="button-secondary" type="button" data-action="duplicate">Duplicar</button>`:''}
        ${onDelete?`<button class="button-secondary danger" type="button" data-action="delete">Eliminar</button>`:''}
      </div>
    </article>
  `;
}

export function historyGrid(items){
  return `<div class="history-grid">${items.map(i=>historyCard(i)).join('')}</div>`;
}

export function emptyHistory(){
  return `<div class="empty-state"><h3>Sin historial</h3><p>No hay configuraciones ni reportes guardados localmente.</p></div>`;
}