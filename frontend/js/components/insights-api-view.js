import {escapeHTML as esc} from './student-ui.js';
import {insightRuleCatalog,readInsights} from '../services/insights-api.service.js';
import {reportContexts} from '../services/reports-api.service.js';
import {onAuthenticationCleared} from '../services/auth.service.js';

const names={'me.activities':'Mis tareas pendientes','monitor.assignments':'Entregas por revisar','institution.courses':'Contenido publicado por curso'};
const statuses={available:'Análisis descriptivo disponible',insufficient_data:'Datos insuficientes para mostrar sugerencias',source_unavailable:'Fuente confirmada no disponible',not_applicable:'No corresponde al contexto consultado',stale:'Datos potencialmente desactualizados'};

export function renderInsightsApi(root,scope){
 const controller=new AbortController();let disposed=false,generation=0,page=1,rules=[],contexts=[],last=null;
 const invalidate=()=>{disposed=true;generation++;controller.abort();root.replaceChildren();};
 const unsubscribe=onAuthenticationCleared(invalidate);
 root.innerHTML='<section class="dashboard-card"><h1>EDUNEXT Insights</h1><p role="status">Consultando reglas autorizadas…</p></section>';
 function status(text){const node=root.querySelector('[data-insight-status]');if(node)node.textContent=text;}
 function clear(){last=null;root.querySelector('[data-insight-output]').replaceChildren();root.querySelectorAll('[data-insight-page]').forEach(b=>b.disabled=true);}
 async function initialize(){
  rules=(await insightRuleCatalog({signal:controller.signal})).filter(r=>r.report_code.startsWith(scope+'.'));
  if(scope==='monitor'&&rules.length)contexts=(await reportContexts()).items;
  if(disposed)return;
  const sources=[...new Set(rules.map(r=>r.report_code))];
  document.querySelectorAll('.demo-label').forEach(node=>node.textContent='Modo API · Insights descriptivos, sin diagnósticos ni decisiones automáticas');
  root.innerHTML=`<section class="dashboard-card"><h1>EDUNEXT Insights</h1><p>Reglas deterministas sobre registros autorizados del servidor. Las sugerencias son opcionales; no modifican notas ni crean actividades.</p><p>Prácticas, evaluaciones y competencias todavía no tienen fuentes confirmadas disponibles en este motor.</p><form data-insight-form><label>Análisis<select name="source">${sources.map(code=>`<option value="${esc(code)}">${esc(names[code]||code)}</option>`).join('')}</select></label>${scope==='monitor'?`<label>Aula, curso y periodo<select name="context">${contexts.map((c,i)=>`<option value="${i}">${esc(c.classroom_title)} · ${esc(c.course_title)} · ${esc(c.period_title)}</option>`).join('')}</select></label>`:''}<button type="submit" ${sources.length?'':'disabled'}>Consultar Insights</button></form><p role="status" aria-live="polite" data-insight-status></p><section data-insight-output></section><nav aria-label="Paginación de Insights"><button type="button" data-insight-page="-1" disabled>Anterior</button><span data-insight-page-label></span><button type="button" data-insight-page="1" disabled>Siguiente</button></nav></section>`;
  const form=root.querySelector('form');
  form.addEventListener('change',()=>{generation++;clear();form.querySelector('button').disabled=!sources.length;status('Consulta de nuevo para aplicar los filtros.');},{signal:controller.signal});
  form.addEventListener('submit',async event=>{
   event.preventDefault();page=1;const filters={};
   if(scope==='monitor'){
    const context=contexts[Number(form.elements.context.value)];
    if(!context){clear();status('No hay contexto docente autorizado disponible.');return;}
    Object.assign(filters,{classroom_id:context.classroom_id,course_id:context.course_id,academic_period_id:context.academic_period_id});
   }
   await load(form.elements.source.value,filters);
  },{signal:controller.signal});
  root.addEventListener('click',async event=>{
   const button=event.target.closest('[data-insight-page]');
   if(button&&!button.disabled&&last){page+=Number(button.dataset.insightPage);await load(last.code,last.filters);}
  },{signal:controller.signal});
  status(sources.length?'Selecciona un análisis para consultar sus fuentes y condiciones.':'No hay reglas autorizadas para esta cuenta.');
 }
 async function load(code,filters){
  const version=++generation,requestedPage=page;clear();status('Consultando servidor…');
  const form=root.querySelector('form'),submit=form.querySelector('button');submit.disabled=true;
  try{
   const data=await readInsights(code,{...filters,page:requestedPage},{signal:controller.signal});
   if(disposed||generation!==version)return;
   const output=root.querySelector('[data-insight-output]');
   output.innerHTML=`<h2>${esc(names[code]||code)}</h2><p>${esc(statuses[data.data_status]||data.data_status)}</p><p>Cálculo del servidor: ${esc(data.metadata.generated_at)} · Zona: ${esc(data.metadata.timezone)}</p><p>Población: ${esc(data.metadata.population_definition)}</p><p>${data.items.length?'':'No hay condiciones para mostrar en esta página. Esto no es una valoración del aprendizaje.'}</p>${data.items.map(item=>{
    const rule=rules.find(r=>r.rule_code===item.rule_code&&r.rule_version===item.rule_version);
    return `<article class="dashboard-card"><h3>${esc(item.explanation)}</h3><p>${esc(statuses[item.data_status]||item.data_status)}</p>${item.suggestion?`<p>Sugerencia opcional: ${esc(item.suggestion)}</p>`:''}<details><summary>¿Por qué se muestra esta sugerencia?</summary><p>Valor observado: ${esc(String(item.observed_value??'No disponible'))}</p><p>Condición: ${esc(rule?.condition||'Consulta el catálogo autorizado')}</p><p>Regla: ${esc(item.rule_code)} v${Number(item.rule_version)}</p><p>Fuente: ${esc(item.source_report_id)} · ${esc(item.source_metric_ids.join(', '))}</p><p>Periodo: ${esc(item.academic_period_id||'No especificado; consulta el ámbito de la fuente')}</p></details></article>`;
   }).join('')}<details><summary>Fuentes, filtros y limitaciones</summary><p>${esc(data.metadata.sources.join(', '))}</p><pre>${esc(JSON.stringify(data.metadata.filters,null,2))}</pre><ul>${data.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details>`;
   last={code,filters};
   root.querySelector('[data-insight-page="-1"]').disabled=requestedPage<=1;
   root.querySelector('[data-insight-page="1"]').disabled=data.source_total===null||requestedPage*data.page_size>=data.source_total;
   root.querySelector('[data-insight-page-label]').textContent=`Página ${requestedPage}; paginación de registros fuente`;
   status(statuses[data.data_status]||data.data_status);
  }catch(error){
   if(disposed||generation!==version)return;
   status(error.status===401?'Sesión expirada; vuelve a iniciar sesión.':error.status===403?'Acceso denegado. No se muestran datos demo.':'No fue posible consultar el análisis. No se muestran resultados anteriores ni datos demo.');
  }finally{if(!disposed&&generation===version)submit.disabled=false;}
 }
 initialize().catch(error=>{if(!disposed)root.innerHTML=`<section role="alert"><h1>Insights no disponible</h1><p>${esc(error.status===401?'Inicia sesión de nuevo.':error.status===403?'Acceso denegado.':'No se pudo consultar el servidor.')}</p><p>No se sustituye con datos de demostración.</p></section>`;});
 return ()=>{unsubscribe();invalidate();};
}
