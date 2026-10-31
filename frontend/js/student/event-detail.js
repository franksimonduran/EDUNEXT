import { bootLearningPage } from './learning-page.js';
import { getEvent } from '../data/agenda-demo.data.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Detalle evento | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const ev = getEvent(params.get('id'));
 if(!ev){ root.innerHTML='<section><h1>Evento no encontrado</h1></section>'; return ()=>{}; }
 root.innerHTML = `<header class="agenda-header"><div class="agenda-title-row"><span class="agenda-avatar" aria-hidden="true">${icon('calendar')}</span><div class="agenda-heading"><h1>${ev.title}</h1><p>${ev.course} · ${ev.grade}º</p></div></div><div class="agenda-header-actions"><a class="button-secondary" href="agenda.html">Volver a Agenda</a></div></header>
 <section class="agenda-events"><h2>Detalle del evento</h2><p>${ev.desc}</p><p>Fecha: ${ev.date}</p><p>Estado: ${ev.status}</p><a class="button-primary" href="${ev.link}">Abrir actividad</a></section>`;
 return ()=>{};
},{active:'agenda'});
