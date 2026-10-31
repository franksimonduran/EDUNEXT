import { bootLearningPage } from './learning-page.js';
import { listAgendaEvents } from '../data/agenda-demo.data.js';
import { renderMonthCalendar } from '../components/calendar-month.js';
import { formatDateISO } from '../utils/calendar-dates.js';
import { icon } from '../components/icons.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {ownAssignments,ownCalendar,ownPlannerSummary} from '../services/academic-planner-api.service.js';
import {renderPlanner} from './planner-api-view.js';
import {escapeHTML as esc} from '../components/student-ui.js';
import {learningURL} from './learning-routes.js';

const live=useProgressApi();
bootLearningPage(async route => {
 if(!live)return {route,grade:route.grade};
 try{
  const start=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const endDate=new Date(`${start}T12:00:00Z`);endDate.setUTCDate(endDate.getUTCDate()+31);
  const [tasks,calendar,summary]=await Promise.all([ownAssignments(),ownCalendar(start,endDate.toISOString().slice(0,10)),ownPlannerSummary()]);
  return {route,tasks,calendar,summary};
  }catch(error){throw error;}
}, (model, _route, shell) => {
 const {route}=model;
 if(model.error){document.querySelector('#learning-content').innerHTML=`<section role="alert"><h1>Agenda no disponible</h1><p>${esc(model.error.message)}</p><p>No se muestran tareas de demostración en modo autenticado.</p></section>`;return ()=>{};}
 if(live)return renderPlanner(model);
 document.title = 'Mi Agenda | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const today = new Date();
 let year = today.getFullYear(), month = today.getMonth();
 let selected = today;
 const events = listAgendaEvents({grade: route.grade});

  function render(focusId){
  const dayISO = formatDateISO(selected);
  const dayEvents = events.filter(e=>e.date===dayISO);
  root.innerHTML = `<header class="agenda-header">
   <div class="agenda-title-row"><span class="agenda-avatar" aria-hidden="true">${icon('calendar')}</span><div class="agenda-heading"><span class="kicker">EDUNEXT AGENDA</span><h1>Mi Agenda</h1><p>Organiza tus actividades y prepárate para cada día</p></div></div>
   <div class="agenda-header-actions"><a class="button-secondary" href="${learningURL('pending-activities', route)}">Actividades pendientes</a><a class="button-secondary" href="${learningURL('reminders', route)}">Recordatorios</a></div>
  </header>
  <section class="agenda-summary">
   <article class="agenda-sum-card"><div><div>Actividades de hoy</div><strong>${events.filter(e=>e.date===formatDateISO(today)).length}</strong></div></article>
   <article class="agenda-sum-card"><div><div>Próximas evaluaciones</div><strong>${events.filter(e=>e.type==='evaluation').length}</strong></div></article>
   <article class="agenda-sum-card"><div><div>Tareas pendientes</div><strong>${events.filter(e=>e.status==='pendiente').length}</strong></div></article>
   <article class="agenda-sum-card"><div><div>Actividades finalizadas</div><strong>0</strong></div></article>
  </section>
  <div class="agenda-layout">
   <div>
    <div class="agenda-cal-nav"><button class="button-secondary" id="prev">Anterior</button><button class="button-secondary" id="today">Hoy</button><button class="button-secondary" id="next">Siguiente</button></div>
    <div id="cal-wrap">${renderMonthCalendar({year,month,selectedDate:selected,events})}</div>
   </div>
   <aside class="agenda-events">
     <h2>Eventos del ${selected.toLocaleDateString(route.lang)}</h2>
     ${dayEvents.length? dayEvents.map(ev=>`<article class="ev-card ev--pend"><h3>${esc(ev.title)}</h3><p>${esc(ev.course)}</p><a class="button-secondary" href="${learningURL('event-detail', {...route,id:ev.id})}">Ver detalle</a></article>`).join(''): '<p>Sin actividades para este día. Selecciona otra fecha para consultar tu agenda.</p>'}
   </aside>
  </div>`;
   root.querySelector('#prev').addEventListener('click',()=>{ month--; if(month<0){month=11;year--;} render('prev'); });
   root.querySelector('#next').addEventListener('click',()=>{ month++; if(month>11){month=0;year++;} render('next'); });
   root.querySelector('#today').addEventListener('click',()=>{ year=today.getFullYear(); month=today.getMonth(); selected=today; render('today'); });
   root.querySelectorAll('.cal-cell[data-day]').forEach(btn=>btn.addEventListener('click',()=>{ const day=btn.dataset.day; selected=new Date(day+'T00:00:00'); render(); root.querySelector(`[data-day="${day}"]`)?.focus(); }));
   if (focusId) root.querySelector(`#${focusId}`)?.focus();
 }
 render();
 return ()=>{};
},{active:'agenda',demoMessage:()=> live?'Agenda consultada en servidor; sin notificaciones remotas.':'Datos de demostración'});
