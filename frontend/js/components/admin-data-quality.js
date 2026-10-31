import {esc} from './admin-dashboard-ui.js';

export function qualityIssueItem(issue){
  const sevClass=issue.severity==='error'?'sev-error':issue.severity==='warning'?'sev-warning':'sev-info';
  return `
    <article class="quality-issue ${sevClass}" data-category="${esc(issue.category)}" data-severity="${esc(issue.severity)}">
      <header>
        <span class="severity-badge ${sevClass}">${esc(issue.severity)}</span>
        <span class="category-badge">${esc(issue.category)}</span>
        <span class="rule-badge">${esc(issue.rule)}</span>
      </header>
      <p class="description">${esc(issue.description)}</p>
      <footer>
        <span class="reference">Ref: ${esc(issue.reference)}</span>
        <span class="status">${esc(issue.status||'open')}</span>
      </footer>
    </article>
  `;
}

export function qualityIssuesList(issues){
  if(!issues?.length)return '<p class="muted">Sin incidencias detectadas.</p>';
  return `<div class="quality-issues-list">${issues.map(qualityIssueItem).join('')}</div>`;
}

export function qualitySummaryCards(summary){
  if(!summary)return '';
  return `
    <div class="quality-summary-cards">
      <article class="summary-card error"><h3>Errores</h3><strong>${summary.errors||0}</strong></article>
      <article class="summary-card warning"><h3>Advertencias</h3><strong>${summary.warnings||0}</strong></article>
      <article class="summary-card info"><h3>Información</h3><strong>${summary.info||0}</strong></article>
      <article class="summary-card total"><h3>Total</h3><strong>${summary.total||0}</strong></article>
    </div>
  `;
}

export function qualityCategoryTabs(categories){
  if(!categories)return '';
  return `
    <div class="quality-tabs" role="tablist">
      ${Object.entries(categories).map(([cat,arr])=>`<button role="tab" class="tab-btn ${arr.length===0?'empty':''}" data-category="${esc(cat)}">${esc(cat)} <span class="tab-count">${arr.length}</span></button>`).join('')}
    </div>
  `;
}