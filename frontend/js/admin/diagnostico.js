import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {runFullDiagnostics,runDiagnosticByCategory,runSingleDiagnostic,getDiagnosticRules,getDiagnosticCategories} from '../services/admin-technical-diagnostics.service.js';
import {diagnosticGrid,diagnosticSummaryCards,categoryTabs,diagnosticCategoryPanel} from '../components/admin-diagnostic-result.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Diagnóstico Técnico','sync');
installAdminUserRoutes();

let allCategories=[];
let currentCategory='all';

async function load(){
  allCategories=getDiagnosticCategories();
  renderTabs();
  bindActions();
  await runAll();
}

function renderTabs(){
  const tabs=root.querySelector('#diag-tabs');
  tabs.removeAttribute('role');
  tabs.innerHTML=categoryTabs([{key:'all',label:'Todas',icon:'list',count:0},...allCategories],'all');
  tabs.onclick=e=>{
    const btn=e.target.closest('[data-category]');
    if(btn){switchCategory(btn.dataset.category);}
  };
}

function switchCategory(cat){
  currentCategory=cat;
  root.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.category===cat));
  root.querySelectorAll('.diag-category-panel').forEach(p=>{p.hidden=p.dataset.category!==cat;});
}

async function runAll(){
  const btn=root.querySelector('#run-all-diag');
  btn.disabled=true;
  btn.textContent='Ejecutando...';
  const result=await runFullDiagnostics();
  renderResults(result);
  btn.disabled=false;
  btn.textContent='Ejecutar diagnóstico completo';
}

async function runCategory(cat){
  const result=await runDiagnosticByCategory(cat);
  renderResults(result);
}

function renderResults(result){
  root.querySelector('#diag-summary').innerHTML=`
    <article class="summary-card success"><h3>Correctas</h3><strong>${result.summary.success}</strong></article>
    <article class="summary-card warning"><h3>Advertencias</h3><strong>${result.summary.warning}</strong></article>
    <article class="summary-card error"><h3>Errores</h3><strong>${result.summary.error}</strong></article>
    <article class="summary-card total"><h3>Total</h3><strong>${result.summary.total}</strong></article>
    <article class="summary-card rate"><h3>Alcance</h3><strong>Local</strong></article>
  `;
  
  const panels=root.querySelector('#diag-panels');
  panels.innerHTML=[{key:'all',label:'Todas'},...allCategories].map(cat=>{
    const tests=result.tests.filter(t=>cat.key==='all'||t.category===cat.key);
    return `<section class="diag-category-panel" data-category="${cat.key}" ${cat.key!=='all'?'hidden':''}><h3>${cat.icon?`<span>${cat.icon}</span>`:''} ${cat.label} <span class="count">${tests.length}</span></h3>${tests.map(t=>`<article class="diagnostic-card ${t.result}"><header><h3>${t.name}</h3><span class="result-badge" style="background:${({success:'#10b981',warning:'#f59e0b',error:'#ef4444',skipped:'#6b7280'})[t.result]}">${({success:'Correcto',warning:'Advertencia',error:'Error',skipped:'No comprobado'})[t.result]}</span></header><p class="test-desc">${t.description}</p><div class="test-meta"><span>Duración: ${t.duration}ms</span></div>${t.evidence?`<p class="evidence">Evidencia: ${t.evidence}</p>`:''}${t.error?`<p class="test-error">Error: ${t.error}</p>`:''}${t.recommendation?`<p class="recommendation">${t.recommendation}</p>`:''}<p class="limitation">${t.limitation}</p></article>`).join('')}</section>`;
  }).join('');
}

function bindActions(){
  root.querySelector('#run-all-diag').onclick=runAll;
  root.querySelector('#diag-tabs').onclick=e=>{
    const btn=e.target.closest('[data-category]');
    if(btn) switchCategory(btn.dataset.category);
  };
}

load();
