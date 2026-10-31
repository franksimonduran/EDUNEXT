import { bootLearningPage } from './learning-page.js';
import { addReminder, listReminders, updateReminder } from '../data/reminders-demo.data.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Editar recordatorio | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const items = listReminders();
 const r = items[id] || null;
 root.innerHTML = `<header class="agenda-header"><div class="agenda-title-row"><span class="agenda-avatar" aria-hidden="true">${icon('calendar')}</span><div class="agenda-heading"><h1>${id?'Editar':'Crear'} recordatorio</h1></div></div></header>
 <section class="agenda-events">
  <form id="frm">
   <label>Título <input id="title" required maxlength="60" value="${r?r.title:''}"></label>
   <label>Fecha <input id="date" type="date" value="${r? (r.date||''): new Date().toISOString().slice(0,10)}"></label>
   <label>Descripción <input id="desc" value="${r?r.desc||'':''}"></label>
   <div class="ev-actions"><button class="button-primary" type="submit">Guardar</button><a class="button-secondary" href="recordatorios.html">Cancelar</a></div>
  </form>
 </section>`;
 root.querySelector('#frm').addEventListener('submit',e=>{
  e.preventDefault();
  const rec = { id: id||Date.now().toString(), title: document.querySelector('#title').value, date: document.querySelector('#date').value, desc: document.querySelector('#desc').value };
  if(id) updateReminder(id,rec); else addReminder(rec);
  location.assign('recordatorios.html');
 });
 return ()=>{};
},{active:'agenda'});
