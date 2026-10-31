import {escapeHTML as esc} from './student-ui.js';
import {icon} from './icons.js';

const node=(tag,cls,html)=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
const tile=(label,value,glyph,tone)=>`<article class="reference-stat"><span class="reference-glyph tone-${tone}">${icon(glyph)}</span><div><p>${esc(label)}</p><strong>${esc(value??'—')}</strong><small>Datos de demostración</small></div></article>`;
const shortcut=(title,description,href,glyph,tone)=>`<a class="reference-shortcut" href="${href}"><span class="reference-glyph tone-${tone}">${icon(glyph)}</span><span><strong>${title}</strong><small>${description}</small></span>${icon('chevron')}</a>`;
function preserve(root){const details=node('details','workspace-disclosure reference-details','<summary>Consultar todos los detalles y herramientas</summary><div class="disclosure-body"></div>');details.lastElementChild.append(...root.children);return details;}
function search(root){
 const bar=document.querySelector('#admin-topbar,#monitor-topbar');
 if(!bar||bar.querySelector('.reference-search'))return;
 const form=node('form','reference-search',`${icon('search')}<label class="sr-only" for="dashboard-search">Buscar en el menú</label><input id="dashboard-search" type="search" placeholder="Buscar en el menú…" autocomplete="off"><div class="reference-search-results" hidden></div>`);
 const input=form.querySelector('input'),results=form.lastElementChild;
 form.addEventListener('submit',e=>e.preventDefault());
 input.addEventListener('input',()=>{const q=input.value.trim().toLocaleLowerCase();const links=[...document.querySelectorAll('#admin-sidebar a[href],#monitor-sidebar a[href]')].filter(a=>a.textContent.toLocaleLowerCase().includes(q)).slice(0,6);results.replaceChildren(...links.map(a=>{const link=document.createElement('a');link.href=a.href;link.textContent=a.textContent.trim();return link;}));if(q&&!links.length)results.textContent='Sin coincidencias en el menú.';results.hidden=!q;});
 form.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;input.value='';}});
 bar.prepend(form);
 root.closest('body')?.classList.add('reference-dashboard');
}
export function referenceMonitor(root,d){
 document.body.classList.add('reference-dashboard','reference-teacher');
 const details=preserve(root);
 const stats=node('section','reference-stats',tile('Mis cursos',d.courses,'book','orange')+tile('Estudiantes',d.pupils.length,'user','blue')+tile('Estudiantes con pendientes',d.pending,'clipboard','orange')+tile('Evaluaciones programadas',d.evaluations.length,'clipboard','purple'));
 stats.setAttribute('aria-label','Resumen docente de demostración');
 const middle=node('div','reference-middle teacher-middle','');
 const progress=node('section','reference-panel',`<header><h2>Progreso de mis estudiantes</h2><a href="reportes.html">Ver detalle</a></header><div class="reference-progress"><div><div class="reference-ring" style="--value:${Number(d.progress)||0}"><strong>${esc(d.progress)}%</strong></div><p>Progreso curricular de muestra</p></div><div class="reference-course-bars">${d.performance.map(r=>`<div><span>${esc(r.course||r.label||r.name||'Curso')}</span><progress max="100" value="${Number(r.percent??r.value??r.average)||0}"></progress><strong>${esc(r.percent??r.value??r.average??'—')}%</strong></div>`).join('')}<small>Datos ficticios; no son notas oficiales.</small></div></div>`);
 // Move existing sourced activity records instead of synthesizing tasks or dates.
 const recent=node('section','reference-panel reference-recent','<header><h2>Actividad reciente</h2><a href="tareas.html">Ver tareas</a></header>');
 const records=details.querySelector('#monitor-activity');
 if(records&&!records.hidden){recent.append(...[...records.querySelectorAll('.record')].slice(0,3).map(r=>r.cloneNode(true)));}else recent.insertAdjacentHTML('beforeend','<p>Sin actividad visible según tus preferencias.</p>');
 middle.append(progress,recent);
 const actions=node('nav','reference-shortcuts',shortcut('Crear evaluación','Diseña evaluaciones locales','editar-evaluacion.html','clipboard','orange')+shortcut('Asignar tarea','Prepara tareas y actividades','tareas.html','clipboard','gold')+shortcut('Ver reportes','Consulta el progreso de tus estudiantes','reportes.html','chart','green')+shortcut('EDUNEXT Insights','Consulta análisis y sus limitaciones','analisis-resultados.html','chart','purple'));
 actions.setAttribute('aria-label','Accesos rápidos docentes');actions.hidden=!d.preferences.showQuickAccess;
 root.replaceChildren(stats,middle,actions,details);search(root);
}
export function referenceAdmin(root,d){
 document.body.classList.add('reference-dashboard','reference-administrator');
 const details=preserve(root),m=d.metrics;
 const stats=node('section','reference-stats',tile('Estudiantes',m.students,'user','purple')+tile('Docentes',m.teachers,'user','cyan')+tile('Cursos del catálogo',m.courses,'book','blue')+tile('Contenidos educativos',m.content,'clipboard','green'));
 stats.setAttribute('aria-label','Indicadores institucionales de demostración');
 const middle=node('div','reference-middle admin-middle','');
 const trend=node('section','reference-panel reference-trend','<header><h2>Progreso general de la institución</h2></header><div class="reference-chart-empty"><span>Progreso institucional</span><div class="reference-grid-lines"></div><p>No hay una serie histórica verificada disponible.</p><small>No se representa una tendencia ficticia.</small></div>');
 const distribution=node('section','reference-panel','<header><h2>Distribución por perfiles</h2></header>');
 const rows=d.users.distribution,total=d.users.total;
 let offset=0;const colors=['#5878ff','#34bce5','#ef68b1'];const stops=rows.map((r,i)=>{const start=offset;offset+=total?r.count/total*100:0;return `${colors[i%3]} ${start}% ${offset}%`;}).join(',');
 distribution.insertAdjacentHTML('beforeend',`<div class="reference-distribution"><div class="reference-donut" style="--segments:conic-gradient(${stops||'#e5eaf3 0% 100%'})"><strong>${esc(total)}<small>Usuarios demo</small></strong></div><ul>${rows.map((r,i)=>`<li><i style="background:${colors[i%3]}"></i><span>${esc(({student:'Estudiantes',monitor:'Docentes',admin:'Administración'})[r.id]||r.id)}</span><strong>${esc(r.count)}</strong></li>`).join('')}</ul></div>`);
 const recent=node('section','reference-panel reference-recent','<header><h2>Actividad reciente</h2><a href="actividad-plataforma.html">Ver detalle</a></header>');
 const activity=details.querySelector('.admin-activity-list');
 if(activity)recent.append(activity.cloneNode(true));else recent.insertAdjacentHTML('beforeend','<p>Sin actividad local disponible.</p>');
 middle.append(trend,distribution,recent);
 const actions=node('nav','reference-shortcuts',shortcut('EDUNEXT Insights','Análisis y límites de los datos','estadisticas-institucionales.html','chart','purple')+shortcut('Sincronización','Consultar estado; sin certificar','sync.html','refresh','green')+shortcut('Seguridad','Revisar configuración y límites','seguridad.html','shield','blue')+shortcut('Almacenamiento','Consultar recursos del dispositivo','almacenamiento-local.html','book','purple'));
 actions.setAttribute('aria-label','Accesos rápidos administrativos');
 root.replaceChildren(stats,middle,actions,details);search(root);
}
