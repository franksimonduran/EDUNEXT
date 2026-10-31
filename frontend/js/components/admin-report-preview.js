import {esc} from './admin-dashboard-ui.js';
const value=v=>v===null||v===undefined?'No disponible':String(v);
export function reportPreview(report,config={}){
 if(!report)return '<p role="status">Sin datos disponibles.</p>';
 const table=(title,headers,rows)=>`<section class="preview-section"><h2>${esc(title)}</h2><div class="table-wrap" tabindex="0" role="region" aria-label="${esc(title)}"><table class="data-table"><caption>${esc(title)} — datos de demostración</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(value(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
 let body='';if(report.summary)body+=table('Resumen',['Métrica','Valor'],Object.entries(report.summary));
 if(report.grades)body+=table('Distribución por grado',['Grado','Estudiantes','Aulas','Porcentaje del total'],report.grades.map(g=>[g.id,g.count,g.rooms,g.percent]));
 if(report.rooms)body+=table('Aulas',['ID','Grado','Sección','Estudiantes'],report.rooms.map(r=>[r.id,r.grade,r.section,r.students]));
 if(report.subjects)body+=table('Asignaturas',['Asignatura','Unidades','Lecciones'],report.subjects.map(s=>[s.name,s.units,s.lessons]));
 if(report.units)body+=table('Unidades',['Unidad','Lecciones'],report.units.map(u=>[u.title,u.lessons]));
 if(report.academic){body+=table('Indicadores separados',['Métrica','Valor'],Object.entries(report.academic).filter(([,v])=>!Array.isArray(v)&&typeof v!=='object'||v===null));body+=table('Correcciones compatibles',['Evaluación / versión','Muestra','Media porcentual'],(report.academic.groups||[]).map(g=>[g.title+' / '+g.version,g.n,g.suppressed?'Suprimido: muestra insuficiente':g.meanPercent]));}
 if(report.formative)body+=table('Prácticas agregadas',['Curso','Registros'],report.formative.map(f=>[f.course,f.count]));
 if(report.content)body+=table('Contenidos locales',['Métrica','Cantidad'],Object.entries(report.content));
 if(report.issues)body+=table('Incidencias técnicas',['Categoría','Regla','Severidad','Descripción'],report.issues.map(i=>[i.category,i.rule,i.severity,i.description]));
 if(report.events)body+=table('Eventos locales',['Tipo','Estado','Fecha','Fuente'],report.events.map(e=>[e.typeLabel,e.state,e.date,'Dispositivo actual']));
 if(report.items)body+=table('Configuraciones locales',['Nombre','Tipo','Fecha'],report.items.map(i=>[i.displayName,i.type,i.updatedAt||i.createdAt]));
 return `<header><h2>${esc(config.name||'Reporte demostrativo')}</h2><p>${esc(report.institution?.name||'Institución de demostración')} · Periodo ${esc(config.period||report.filters?.period||'No definido')}</p><p id="preview-date">${esc(report.generatedAt||'Fecha no disponible')}</p></header><p class="demo-notice">Reporte de demostración — No oficial.</p>${body}<section><h2>Metodología, fuentes y limitaciones</h2><p>${esc(report.methodology||'Información local de demostración.')}</p><ul>${(report.limitations||[]).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></section>`;
}
