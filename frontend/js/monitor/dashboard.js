import {monitor,monitorNavigation,classrooms} from '../data/monitor-demo.data.js';
import {getDashboard} from '../services/monitor-dashboard.service.js';
import {renderSidebar} from '../components/sidebar.js';
import {renderTopbar} from '../components/topbar.js';
import {escapeHTML as esc,progressBar} from '../components/student-ui.js';
import {summaryCard,academicChart,action} from '../components/monitor-dashboard-cards.js';
import {loadAcademicData,academicScope} from '../services/monitor-grades.service.js';
import {assignedCourses,courseSummary} from '../services/monitor-courses.service.js';
import {listDrafts} from '../services/monitor-content-drafts.service.js';
import {initializeMonitorSettings,monitorPreferences} from '../services/monitor-settings.service.js';
import {installAccountNavigation} from '../components/monitor-account-navigation.js';
import {composeMonitorDashboard} from '../components/dashboard-composition.js';
import {monitorDemoURL,demoUnavailable} from './demo-navigation.js';
const shell=document.querySelector('.monitor-shell'),sidebar=document.querySelector('#monitor-sidebar'),content=document.querySelector('#dashboard-content'),selector=document.querySelector('#classroom'),dialog=document.querySelector('#monitor-dialog');
initializeMonitorSettings();
let collapsed=false,selected=monitorPreferences().initialRoom,snapshot;
let renderGeneration=0;
const date=value=>new Date(value).toLocaleString('es',{dateStyle:'medium',timeStyle:'short'});
const roomName=id=>{const c=classrooms.find(c=>c.id===id);return c?`${c.grade}.º primaria — Sección ${c.section}`:'Aula no disponible';};
function open(title,html){document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
installAccountNavigation(open);
function navigation(){renderSidebar(sidebar,collapsed,'home',{sections:monitorNavigation});shell.classList.toggle('collapsed',collapsed);}
async function render(){
 const generation=++renderGeneration,currentRoom=selected,data=await loadAcademicData(),contentCourses=(await assignedCourses()).filter(c=>currentRoom==='all'||c.rooms.some(r=>r.id===currentRoom)),contentStats=courseSummary(contentCourses,await listDrafts());
 if(generation!==renderGeneration)return;
 snapshot=getDashboard(currentRoom);const d=snapshot,academic=academicScope(data,{room:currentRoom});
 d.evaluations=academic.evaluations.filter(e=>e.state==='scheduled'&&e.assignment?.rooms.length).map(e=>({id:e.id,name:e.title,course:e.course,classroomId:currentRoom==='all'?e.assignment.rooms[0]:currentRoom,date:e.assignment.start,duration:e.duration,status:'Programada localmente (demostración)',openReview:academic.rows.filter(r=>r.evaluationId===e.id&&r.status==='review-pending').length}));
 content.innerHTML=`<section class="monitor-card monitor-hero"><div><h2>Panel de seguimiento académico</h2><p>Consulta el progreso de tus aulas y acompaña el aprendizaje de cada estudiante.</p><div class="actions">${action('students','Ver estudiantes')}${action('evaluations','Crear evaluación')}${action('reports','Consultar reportes')}</div></div><img src="../assets/images/branding/mark.svg" alt="EDUNEXT"></section>
 <section class="monitor-summary" aria-label="Resumen académico">${summaryCard('Estudiantes',d.pupils.length,'En las aulas seleccionadas','students')}${summaryCard('Aulas',d.rooms.length,'Aulas seleccionadas asignadas','classrooms')}${summaryCard('Cursos',d.courses,'Cursos por grado en las aulas seleccionadas','courses')}${summaryCard('Evaluaciones',d.evaluations.length,'Programadas en la demostración','evaluations')}</section>
 <div class="monitor-grid"><section class="monitor-card"><h2>Rendimiento académico</h2><p>Promedio de aciertos en prácticas formativas registradas (demostración).</p>${academicChart(d.performance)}<p class="muted">Aciertos ÷ preguntas respondidas. No son notas oficiales.</p></section>
 <section class="monitor-card"><h2>Progreso del aula</h2><strong>${d.progress}%</strong>${progressBar(d.progress,'Progreso curricular agregado')}<p>${d.completed} lecciones-estudiante completadas de ${d.assigned} asignadas.</p><p>${d.pending} estudiantes con actividades pendientes.</p><p class="muted">Suma de lecciones completadas ÷ suma de lecciones asignadas. Sin historial comparativo.</p></section>
 <section class="monitor-card"><h2>Mis aulas</h2>${d.rooms.map(c=>{const r=getDashboard(c.id);return `<article class="record"><h3>${roomName(c.id)}</h3><p>${r.pupils.length} estudiantes · ${c.courseIds.length} cursos · Progreso ${r.progress}%</p><button data-classroom="${c.id}" type="button">Ver aula</button></article>`;}).join('')||'<p>Sin aulas asignadas.</p>'}</section>
 <section class="monitor-card"><h2>Próximas evaluaciones</h2>${d.evaluations.map(e=>`<article class="record"><h3>${esc(e.name)}</h3><p>${roomName(e.classroomId)} · ${e.course}</p><p>${date(e.date)} · ${e.duration} minutos · ${esc(e.status)}</p><p>${e.openReview} respuestas abiertas pendientes de revisión (muestra).</p>${action('evaluations','Ver evaluación')}</article>`).join('')||'<p>Sin evaluaciones.</p>'}</section>
 <section class="monitor-card"><h2>Estudiantes que pueden necesitar apoyo</h2><p class="muted">Regla demostrativa: dos prácticas del mismo tema con menos del 50 % de aciertos.</p>${d.support.slice(0,5).map(s=>`<article class="record"><h3>${s.alias}</h3><p>${roomName(s.classroomId)} · ${s.course}</p><p>${s.topic} · ${s.evidence} prácticas por debajo del 50 %.</p><button type="button" data-evidence="${s.id}">Ver detalle</button></article>`).join('')||'<p>Sin observaciones para esta selección.</p>'}</section>
 <section class="monitor-card"><h2>EDUNEXT Insights</h2><p>Detecta tendencias y encuentra oportunidades de mejora.</p><p>${d.support.length} estudiantes asociados a dificultades en prácticas de Matemática: comparación de fracciones.</p><p class="muted">Observación por reglas sobre datos ficticios, sin análisis de IA. Evidencia: dos prácticas por estudiante con 3/10 aciertos.</p><div class="actions">${action('insights','Ver análisis')}${action('support','Preparar refuerzo')}</div><h2>Estado de sincronización</h2><p class="sync-note">Estado de sincronización no disponible. Se requiere conectar el servicio de datos.</p><p>Última actualización confirmada: desconocida. Operaciones remotas pendientes y confirmadas: desconocidas.</p><p class="muted">Este dispositivo no puede conocer los cambios pendientes de estudiantes desconectados.</p></section>
 <section class="monitor-card"><h2>Actividad reciente</h2>${d.activities.map(a=>`<article class="record"><strong>${esc(a.description)}</strong><p>${roomName(a.classroomId)} · ${esc(a.type)}</p><p>${date(a.date)} · ${esc(a.status)}</p></article>`).join('')||'<p>Sin actividades recientes.</p>'}</section>
 <section class="monitor-card"><h2>Avisos y recordatorios</h2><p>${d.pending} estudiantes tienen lecciones pendientes en el conjunto ficticio.</p><p>${academic.summary.pending} intentos locales de muestra esperan revisión.</p><p>Servicio de datos: pendiente de integración. Información mostrada exclusivamente demostrativa.</p></section>
 <section class="monitor-card wide"><h2>Acciones rápidas</h2><div class="quick-actions">${[['students','Ver estudiantes'],['classrooms','Ver aulas'],['evaluations','Crear evaluación'],['grades','Revisar notas'],['support','Asignar refuerzo'],['insights','Consultar Insights'],['calendar','Abrir calendario'],['sync','Revisar sincronización']].map(([key,label])=>`<button type="button" data-module="${key}"><span>${esc(label)}</span> <small>Módulo en construcción</small></button>`).join('')}</div></section></div>`;
  const chart=content.querySelector('.chart-row')?.parentElement;
  const prefs=monitorPreferences();const activityCard=[...content.querySelectorAll('.monitor-card')].find(c=>c.querySelector('h2')?.textContent==='Actividad reciente');if(activityCard)activityCard.hidden=!prefs.showActivities;const quickCard=content.querySelector('.quick-actions')?.closest('section');if(quickCard)quickCard.hidden=!prefs.showQuickAccess;
  for(const [page,label] of [['perfil','Mi Perfil'],['ayuda','Ayuda y Soporte']]){const a=document.createElement('a');a.href=page+'.html';a.textContent=label;content.querySelector('.monitor-hero .actions').append(a);}
  if(generation===1&&prefs.dashboardSection!=='overview')setTimeout(()=>{(prefs.dashboardSection==='content'?content.querySelector('[aria-label="Contenidos educativos"]'):[...content.querySelectorAll('section')].find(s=>s.querySelector('h2')?.textContent==='Mis aulas'))?.scrollIntoView({block:'start'});},0);
  const studioSummary=document.createElement('section');studioSummary.className='monitor-summary';studioSummary.setAttribute('aria-label','Contenidos educativos');studioSummary.innerHTML=[['Cursos',contentStats.courses],['Unidades',contentStats.units],['Lecciones',contentStats.lessons],['Borradores locales',contentStats.drafts]].map(([label,value])=>summaryCard(label,value,'Catálogo compartido y propuestas locales','courses')).join('');content.querySelector('.monitor-summary').after(studioSummary);
  const courseLink=document.createElement('a');courseLink.href='cursos.html'+(currentRoom==='all'?'':'?room='+currentRoom);courseLink.textContent='Mis Cursos';content.querySelector('.monitor-hero .actions').append(courseLink);
  const insights=content.querySelector('[data-module="insights"]')?.closest('section');if(insights){const links=document.createElement('div');links.className='actions';links.innerHTML='<a href="detalle-curso.html?grade=4&course=math">Consultar tema y unidad de Matemática</a><a href="lecciones.html?grade=4&course=math&unit=math-g4-u1">Ver lecciones de fracciones</a><a href="recursos-educativos.html?grade=4&course=math">Seleccionar recursos de apoyo</a><a href="editar-leccion.html?grade=4&course=math&unit=math-g4-u1">Preparar material de apoyo</a>';insights.append(links);}
  content.querySelectorAll('[data-module] small').forEach(node=>node.textContent=node.closest('[data-module]').dataset.module==='sync'?'Consultar límites del almacenamiento local':'Abrir vista de demostración');
  content.querySelectorAll('[data-module="evaluations"] small').forEach(node=>node.textContent='Crear borrador docente local');
 content.querySelectorAll('[data-module="grades"] small').forEach(node=>node.textContent='Consultar registro académico local');
 content.querySelectorAll('[data-module="support"] small').forEach(node=>node.textContent='Preparar apoyo educativo local');
 for(const [page,label] of [['tareas','Mis Tareas'],['seguimiento-actividades','Seguimiento de Actividades']]){const link=document.createElement('a');link.className='eval-link';link.href=page+'.html'+(selected==='all'?'':'?room='+selected);link.textContent=label;content.querySelector('.monitor-hero .actions')?.append(link);}
 const resultsLink=document.createElement('a');resultsLink.href=selected==='all'?'notas.html':`notas.html?room=${selected}`;resultsLink.textContent='Consultar resultados revisados';content.querySelector('.summary [data-module="evaluations"]')?.parentElement.append(resultsLink);
 if(chart){const analysisLink=document.createElement('a');analysisLink.href=selected==='all'?'analisis-resultados.html':`analisis-resultados.html?room=${selected}`;analysisLink.textContent='Analizar resultados de evaluaciones y prácticas';chart.append(analysisLink);}
  if(chart){const link=document.createElement('a');link.href=selected==='all'?'aulas.html':`seguimiento-aula.html?id=${selected}`;link.textContent='Consultar seguimiento del aula';chart.append(link);}
  const heroActions = content.querySelector('.monitor-hero .actions');
  const secondaryActions = [...heroActions.children].slice(3);
   if (secondaryActions.length) {
   const tools = document.createElement('details');
   tools.className = 'dashboard-tools';
   const summary = document.createElement('summary');
   summary.textContent = 'Más herramientas docentes';
   const links = document.createElement('div');
   links.className = 'actions';
   links.append(...secondaryActions);
   tools.append(summary, links);
    content.querySelector('.monitor-hero').after(tools);
   }
    composeMonitorDashboard(content, {pending:academic.summary.pending,pendingStudents:d.pending,scheduled:d.evaluations.length,preferences:prefs,snapshot:d});
}
function connection(){const online=navigator.onLine;document.querySelector('#connection-indicator').textContent=online?'Con conexión de red':'Sin conexión';document.querySelector('#network-notice').textContent=online?'Conectividad orientativa del navegador. Servicio de datos sin integrar.':'Sin conexión. Se muestran datos ficticios incluidos en esta vista; no resultados actuales del servidor.';}
 renderTopbar(document.querySelector('#monitor-topbar'),monitor,{role:'monitor'});navigation();
selector.innerHTML='<option value="all">Todas mis aulas</option>'+classrooms.filter(c=>monitor.classroomIds.includes(c.id)).map(c=>`<option value="${c.id}">${roomName(c.id)}</option>`).join('');
selector.value=selected;
selector.addEventListener('change',()=>{selected=selector.value;render().catch(()=>content.textContent='No se pudo actualizar el resumen local. Recarga para reintentar.');});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='close-dialog'){dialog.close();return;}
 if(b.id==='sidebar-toggle'){collapsed=!collapsed;navigation();shell.classList.remove('menu-open');document.querySelector('#sidebar-toggle').focus();return;}
 if(b.dataset.classroom){location.assign(`detalle-aula.html?id=${encodeURIComponent(b.dataset.classroom)}`);return;}
 if(b.dataset.evidence){location.assign(`detalle-estudiante.html?id=${encodeURIComponent(b.dataset.evidence)}`);return;}
 if(b.dataset.open==='navigation'){shell.classList.toggle('menu-open');return;}
 if(b.dataset.open==='notifications'){open('Notificaciones · Demostración',(snapshot?.evaluations||[]).map(e=>`<article class="record"><h3>Evaluación próxima de muestra</h3><p>${esc(e.name)} · ${roomName(e.classroomId)} · ${date(e.date)}</p><p>${e.openReview} intentos locales de muestra pendientes de revisión.</p></article>`).join('')||'<p>Sin notificaciones disponibles en el resumen local.</p>');return;}
 if(b.dataset.open==='user'){open('Perfil de demostración',`<p>${esc(monitor.alias)} · Monitor / Docente</p><p>${esc(monitor.institution)}</p><p>Perfil y configuración docente en construcción.</p><a href="../role-selection.html">Volver a perfiles</a>`);return;}
   const key=b.dataset.module||b.dataset.section;
   if(key==='insights'){location.assign(monitorDemoURL(key,selected));return;}
  if(key==='courses'){location.assign('cursos.html'+(selected==='all'?'':'?room='+selected));return;}
  if(key==='calendar'){location.assign('calendario.html');return;}
  if(key==='sync'){location.assign('privacidad.html#local-storage');return;}
 if(key==='tasks'||key==='support'){location.assign(`${key==='tasks'?'tareas':'refuerzos'}.html${selected==='all'?'':'?room='+selected}`);return;}
 if(key==='grades'){location.assign(`${b.dataset.module?'registro-notas':'notas'}.html${selected==='all'?'':'?room='+selected}`);return;}
 if(key==='reports'){location.assign(`reportes.html${selected==='all'?'':'?room='+selected}`);return;}
 if(key==='evaluations'){location.assign(b.textContent.trim().startsWith('Crear evaluación')?'editar-evaluacion.html':'evaluaciones.html');return;}
 if(key==='students'||key==='classrooms'){location.assign(key==='students'?`estudiantes.html${selected==='all'?'':'?room='+selected}`:'aulas.html');return;}
 if(key==='home'){shell.classList.remove('menu-open');document.querySelector('#monitor-main').scrollIntoView();return;}
 if(key==='logout'){open('Salir de la demostración','<p>No hay sesión autenticada activa.</p><a href="../role-selection.html">Volver a selección de perfiles</a>');return;}
  if(key)open('No disponible en esta demo',demoUnavailable);
});
window.addEventListener('online',connection);window.addEventListener('offline',connection);
document.addEventListener('keydown',e=>{if(e.key==='Escape')shell.classList.remove('menu-open');});
connection();render().catch(()=>content.textContent='No se pudieron consultar los datos demostrativos. Recarga para reintentar.');
