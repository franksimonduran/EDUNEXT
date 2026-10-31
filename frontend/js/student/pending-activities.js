import { bootLearningPage } from './learning-page.js';
import { listAgendaEvents } from '../data/agenda-demo.data.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Actividades pendientes | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const events = listAgendaEvents({grade: route.grade});

 root.innerHTML = `<header class="agenda-header"><div class="agenda-title-row"><span class="agenda-avatar" aria-hidden="true">${icon('clipboard')}</span><div class="agenda-heading"><h1>Mis actividades pendientes</h1><p>Consulta lo que necesitas realizar y organiza tu aprendizaje</p></div></div></header>
 <section class="agenda-summary"><article class="agenda-sum-card"><div><div>Pendientes</div><strong>${events.filter(e=>e.status!=='completada').length}</strong></div></article><article class="agenda-sum-card"><div><div>Para hoy</div><strong>${events.length}</strong></div></article></section>
 <section class="agenda-events">${events.map(ev=>`<article class="ev-card ev--pend"><h3>${ev.title}</h3><p>${ev.course} · ${ev.date}</p><a class="button-primary" href="${ev.link}">Ir a la actividad</a></article>`).join('')}</section>`;
 return ()=>{};
},{active:'agenda'});
