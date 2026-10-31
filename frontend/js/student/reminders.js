import { bootLearningPage } from './learning-page.js';
import { listReminders, deleteReminder } from '../data/reminders-demo.data.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Mis recordatorios | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const items = listReminders();
 root.innerHTML = `<header class="agenda-header"><div class="agenda-title-row"><span class="agenda-avatar" aria-hidden="true">${icon('calendar')}</span><div class="agenda-heading"><h1>Mis recordatorios</h1><p>Organiza tus propias actividades</p></div></div><div class="agenda-header-actions"><a class="button-primary" href="editar-recordatorio.html">Crear recordatorio</a></div></header>
 <section class="agenda-events">${items.length? items.map((r,i)=>`<article class="ev-card"><h3>${r.title}</h3><p>${r.date||''}</p><div class="ev-actions"><a class="button-secondary" href="editar-recordatorio.html?id=${r.id||i}">Editar</a><button class="button-monitor" data-del="${r.id||i}">Eliminar</button></div></article>`).join(''): '<p>Sin recordatorios personales</p>'}</section>`;
 root.querySelectorAll('[data-del]').forEach(btn=>btn.addEventListener('click',()=>{ if(confirm('¿Eliminar recordatorio?')){ deleteReminder(btn.dataset.del); location.reload(); }}));
 return ()=>{};
},{active:'agenda'});
