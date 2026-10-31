import {escapeHTML as esc} from './student-ui.js';
import {reportCatalog,reportContexts,academicReportContexts,readReport,downloadReport} from '../services/reports-api.service.js';
import {renderInsightsApi} from './insights-api-view.js';
import {onAuthenticationCleared} from '../services/auth.service.js';

const labels={completion_percentage:'Finalización de lecciones (%)',submission_percentage:'Entregas confirmadas (%)',unique_students_count:'Estudiantes únicos',active_courses_count:'Cursos activos',completed_lessons_count:'Lecciones completadas',applicable_lessons_count:'Lecciones aplicables',received_count:'Entregas recibidas',pending_count:'Pendientes',recipients_count:'Destinatarios',reviewed_count:'Revisadas',review_pending_count:'Por revisar',earned_achievements_count:'Reconocimientos',grade:'Grado',title:'Título'};
const name=key=>labels[key]||key.replaceAll('_',' ');
const stateLabels={suppressed_small_cohort:'Datos suprimidos por privacidad de grupos pequeños',source_not_available:'Fuente confirmada no disponible',no_applicable_records:'Sin registros aplicables',partial:'Datos parciales: consulta las limitaciones',calculated_from_server_records:'Calculado a partir de registros confirmados'};

export function renderReportsApi(root,scope){
 if(new URLSearchParams(location.search).get('vista')==='insights')return renderInsightsApi(root,scope);
 const controller=new AbortController();let disposed=false,catalog=[],contexts=[],years=[],last=null,page=1,generation=0;
 const unsubscribe=onAuthenticationCleared(()=>{disposed=true;generation++;controller.abort();root.replaceChildren();});
 root.innerHTML='<section class="dashboard-card"><h1>Reportes EDUNEXT</h1><p role="status">Consultando catálogo autorizado…</p></section>';
 const generic=()=>{document.querySelectorAll('.demo-label').forEach(node=>node.textContent='Modo API · Reportes informativos, no oficiales');const alias=document.querySelector('[data-monitor-alias]');if(alias)alias.textContent='Cuenta autenticada';document.querySelectorAll('[data-open="notifications"],.notification-button').forEach(node=>node.disabled=true);};generic();
 async function initialize(){
  catalog=(await reportCatalog()).filter(report=>report.code.startsWith(scope+'.'));
  if(scope==='monitor'&&catalog.length)contexts=(await reportContexts()).items;
  if(scope==='institution'&&catalog.length)years=(await academicReportContexts()).items;
  if(disposed)return;
  root.innerHTML=`<section class="dashboard-card"><h1>Reportes EDUNEXT</h1><p>Consulta autorizada al servidor. Documento informativo; no es una boleta oficial.</p><form data-report-form><label>Reporte<select name="report">${catalog.map(r=>`<option value="${esc(r.code)}">${esc(r.name)}</option>`).join('')}</select></label>${scope==='monitor'?`<label>Aula, curso y periodo<select name="context">${contexts.map((c,i)=>`<option value="${i}">${esc(c.classroom_title)} · ${esc(c.course_title)} · ${esc(c.period_title)}</option>`).join('')}</select></label>`:''}${scope==='institution'?`<label data-year>Año académico<select name="year"><option value="">Vigente a la fecha actual</option>${years.map(y=>`<option value="${esc(y.id)}">${esc(y.name)}</option>`).join('')}</select></label><label data-cutoff>Fecha de corte, ISO con zona horaria (opcional)<input name="cutoff" placeholder="2026-10-23T17:00:00-05:00"></label>`:''}<button type="submit" ${catalog.length?'':'disabled'}>Consultar reporte</button></form><p role="status" aria-live="polite" data-report-status></p><button type="button" data-export disabled>Descargar CSV autorizado</button><section data-report-output></section><nav aria-label="Paginación del reporte"><button type="button" data-page="-1" disabled>Anterior</button><span data-page-label></span><button type="button" data-page="1" disabled>Siguiente</button></nav></section>`;
   const form=root.querySelector('form');
   const insightsLink=document.createElement('a'),insightsUrl=new URL(location.href);
   insightsUrl.searchParams.set('vista','insights');insightsUrl.searchParams.set('modo','api');
   insightsLink.href=insightsUrl.href;insightsLink.textContent='Consultar EDUNEXT Insights con fuentes autorizadas';
   form.before(insightsLink);
  form.insertAdjacentHTML('beforeend','<label data-since>Desde, ISO con zona horaria<input name="since"></label><label data-until>Hasta, ISO con zona horaria<input name="until"></label>');
  form.elements.since.value=new Date(Date.now()-30*86400000).toISOString();form.elements.until.value=new Date().toISOString();
  function changed(){
   generation++;
   form.querySelector('button').disabled=!catalog.length;
   last=null;root.querySelector('[data-report-output]').replaceChildren();root.querySelector('[data-export]').disabled=true;
   root.querySelectorAll('[data-page]').forEach(b=>b.disabled=true);
   const dates=catalog.find(d=>d.code===form.elements.report.value)?.filters.includes('since');
   root.querySelector('[data-since]').hidden=!dates;root.querySelector('[data-until]').hidden=!dates;
   if(scope==='institution'){const enrollment=form.elements.report.value==='institution.enrollments';root.querySelector('[data-year]').hidden=!enrollment;root.querySelector('[data-cutoff]').hidden=!enrollment;}
  }
  form.addEventListener('change',changed,{signal:controller.signal});changed();
  form.addEventListener('submit',async event=>{
   event.preventDefault();page=1;const filters={};const code=form.elements.report.value;
   if(scope==='monitor'){
    const c=contexts[Number(form.elements.context.value)];if(!c){status('No hay un contexto docente disponible.');return;}
    Object.assign(filters,{classroom_id:c.classroom_id,course_id:c.course_id,academic_period_id:c.academic_period_id});
   }
   if(code==='institution.enrollments'){
    if(form.elements.year.value)filters.academic_year_id=form.elements.year.value;
    if(form.elements.cutoff.value.trim())filters.cutoff=form.elements.cutoff.value.trim();
   }
   if(catalog.find(d=>d.code===code)?.filters.includes('since')){
    filters.since=form.elements.since.value.trim();filters.until=form.elements.until.value.trim();
   }
   await load(code,filters);
  },{signal:controller.signal});
  root.addEventListener('click',async event=>{
   const paging=event.target.closest('[data-page]');if(paging&&last){page+=Number(paging.dataset.page);await load(last.code,last.filters);}
   if(event.target.closest('[data-export]')&&last){const button=root.querySelector('[data-export]');button.disabled=true;
    try{await downloadReport(last.code,{...last.filters,page:1});status('CSV generado y recibido.');}
    catch(error){status(`No se generó la exportación: ${error.message}`);}finally{if(!disposed)button.disabled=false;}
   }
  },{signal:controller.signal});
  status(catalog.length?'Selecciona un reporte y consulta sus fuentes y definiciones.':'No hay reportes autorizados para esta cuenta.');
 }
 function status(text){const node=root.querySelector('[data-report-status]');if(node)node.textContent=text;}
 async function load(code,filters){
  const requestGeneration=++generation,requestedPage=page;
  const output=root.querySelector('[data-report-output]');output.replaceChildren();root.querySelector('[data-export]').disabled=true;
  const form=root.querySelector('form');form.querySelector('button').disabled=true;status('Consultando datos del servidor…');
  try{
   const report=await readReport(code,{...filters,page:requestedPage});if(disposed||requestGeneration!==generation)return;
   const meta=report.metadata;last={code,filters};
   const percent=(value,key)=>value===null?'No disponible':key.endsWith('percentage')?`<meter min="0" max="100" value="${Number(value)}" aria-label="${esc(name(key))}"></meter> ${Number(value)} %`:esc(String(value));
   output.innerHTML=`<h2>${esc(catalog.find(d=>d.code===code)?.name||code)}</h2><p>${esc(stateLabels[meta.data_status]||meta.data_status)}</p><p>Generado: ${esc(new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:meta.timezone}).format(new Date(meta.generated_at)))} · ${esc(meta.timezone)} · Definición v${meta.definition_version}</p><p>Población: ${esc(meta.population_definition)}</p><ul>${meta.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul><dl>${report.metrics.map(metric=>`<dt>${esc(name(metric.id))}</dt><dd>${percent(metric.value,metric.id)} · ${esc(metric.unit)}${metric.denominator!==null?` · ${metric.numerator}/${metric.denominator}`:''}</dd>`).join('')}</dl>${report.rows.length?`<div style="overflow:auto"><table><caption>Datos autorizados, página ${report.page}</caption><thead><tr>${report.columns.map(column=>`<th scope="col">${esc(name(column))}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row=>`<tr>${report.columns.map(column=>`<td>${percent(row[column]??null,column)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p>No hay filas disponibles para mostrar en esta consulta.</p>'}<details><summary>Fuentes, filtros y definiciones</summary><p>${esc(meta.sources.join(', '))}</p><pre>${esc(JSON.stringify({filters:meta.filters,definitions:report.definitions},null,2))}</pre></details>`;
   root.querySelector('[data-export]').disabled=!catalog.find(d=>d.code===code)?.export_formats.includes('csv');
   root.querySelector('[data-page="-1"]').disabled=page<=1;
   root.querySelector('[data-page="1"]').disabled=report.total===null||page*report.page_size>=report.total;
   root.querySelector('[data-page-label]').textContent=`Página ${page}`;
   status(stateLabels[meta.data_status]||meta.data_status);
  }catch(error){if(disposed||requestGeneration!==generation)return;last=null;status(`Reporte no disponible: ${error.message}. No se muestran datos demo ni resultados anteriores.`);root.querySelectorAll('[data-page]').forEach(b=>b.disabled=true);}
  finally{if(!disposed&&requestGeneration===generation)form.querySelector('button').disabled=false;}
 }
 initialize().catch(error=>{if(!disposed)root.innerHTML=`<section role="alert"><h1>Reportes no disponibles</h1><p>${esc(error.message)}</p><p>No se sustituyen por cifras de demostración.</p></section>`;});
  return ()=>{unsubscribe();disposed=true;controller.abort();root.replaceChildren();};
}
