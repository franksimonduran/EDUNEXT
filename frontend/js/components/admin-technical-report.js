import {esc} from './admin-dashboard-ui.js';
import {generateTechnicalSummary,generateSafeJSON,downloadTextFile,copyToClipboard} from '../utils/safe-technical-export.js';

export function technicalReportPanel(summary){
  return `
    <section class="technical-report-panel">
      <header>
        <h2>Resumen Técnico Local</h2>
        <div class="report-actions">
          <button class="button-secondary" id="copy-report">Copiar al portapapeles</button>
          <button class="button-secondary" id="download-report">Descargar TXT</button>
          <button class="button-secondary" id="download-json">Descargar JSON</button>
        </div>
      </header>
      <pre class="report-content" id="report-text">${esc(summary.text)}</pre>
    </section>
  `;
}

export function bindReportActions(summary){
  const copyBtn=document.getElementById('copy-report');
  const dlTxtBtn=document.getElementById('download-report');
  const dlJsonBtn=document.getElementById('download-json');
  
  if(copyBtn) copyBtn.onclick=async()=>{
    const ok=await copyToClipboard(summary.text);
    alert(ok?'Copiado al portapapeles':'Error al copiar');
  };
  
  if(dlTxtBtn) dlTxtBtn.onclick=()=>{
    downloadTextFile(summary.text,`edunext-tech-summary-${Date.now()}.txt`);
  };
  
  if(dlJsonBtn) dlJsonBtn.onclick=()=>{
    downloadTextFile(summary.json,`edunext-tech-summary-${Date.now()}.json`);
  };
}

export async function generateFullTechnicalReport(){
  const {collectTechnicalSummary,formatSummaryForDisplay,generateSafeJSON}=await import('../utils/safe-technical-export.js');
  const data=await collectTechnicalSummary();
  return {
    text:formatSummaryForDisplay(data),
    json:generateSafeJSON(data),
    data,
  };
}

export function renderReportPreview(report){
  return `
    <section class="report-preview">
      <header>
        <h2>Vista previa del informe</h2>
      </header>
      <pre class="report-preview-content">${escapeHTML(report.text)}</pre>
      <div class="report-actions">
        <button class="button-secondary" id="copy-preview">Copiar</button>
        <button class="button-secondary" id="download-txt">Descargar TXT</button>
        <button class="button-secondary" id="download-json-btn">Descargar JSON</button>
      </div>
    </section>
  `;
}

function escapeHTML(str){return esc(String(str));}
