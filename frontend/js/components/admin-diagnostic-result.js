import {esc} from './admin-dashboard-ui.js';
import {formatTechnicalDate,formatDuration} from '../utils/technical-date-format.js';

export function diagnosticCard(test){
  const statusColors={
    success:'#10b981',
    warning:'#f59e0b',
    error:'#ef4444',
    skipped:'#6b7280',
  };
  const statusLabels={
    success:'Correcto',
    warning:'Advertencia',
    error:'Error',
    skipped:'No comprobado',
  };
  return `
    <article class="diagnostic-card ${test.result}" data-test="${esc(test.id)}">
      <header>
        <h3>${esc(test.name)}</h3>
        <span class="result-badge" style="background:${statusColors[test.result]}">${esc(statusLabels[test.result])}</span>
      </header>
      <p class="test-desc">${esc(test.description)}</p>
      <div class="test-meta">
        <span>Categoría: ${esc(test.category)}</span>
        <span>Duración: ${formatDuration(test.duration)}</span>
      </div>
      ${test.evidence?`<p class="evidence">Evidencia: ${esc(test.evidence)}</p>`:''}
      ${test.error?`<p class="test-error">Error: ${esc(test.error)}</p>`:''}
      ${test.recommendation?`<p class="recommendation">${esc(test.recommendation)}</p>`:''}
      <p class="limitation">${esc(test.limitation)}</p>
    </article>
  `;
}

export function diagnosticGrid(tests){
  return `<div class="diagnostic-grid">${tests.map(diagnosticCard).join('')}</div>`;
}

export function diagnosticSummaryCards(summary){
  return `
    <div class="diag-summary-cards">
      <article class="summary-card success"><h3>Correctas</h3><strong>${summary.success}</strong></article>
      <article class="summary-card warning"><h3>Advertencias</h3><strong>${summary.warning}</strong></article>
      <article class="summary-card error"><h3>Errores</h3><strong>${summary.error}</strong></article>
      <article class="summary-card total"><h3>Total</h3><strong>${summary.total}</strong></article>
      <article class="summary-card rate"><h3>Tasa éxito</h3><strong>${summary.passRate}%</strong></article>
    </div>
  `;
}

export function categoryTabs(categories,active){
  return `
    <div class="category-tabs" role="tablist">
      ${categories.map(c=>`
        <button role="tab" class="tab-btn ${c.key===active?'active':''}" data-category="${c.key}">
          ${c.icon?`<span class="tab-icon">${c.icon}</span>`:''} ${c.label}
          <span class="tab-count">${c.count||0}</span>
        </button>
      `).join('')}
    </div>
  `;
}

export function diagnosticCategoryPanel(category,tests){
  return `
    <section class="diag-category-panel" data-category="${category.key}" ${category.key!=='all'?'hidden':''}>
      <h3>${category.icon?`<span>${category.icon}</span>`:''} ${category.label} <span class="count">${tests.length}</span></h3>
      ${diagnosticGrid(tests)}
    </section>
  `;
}