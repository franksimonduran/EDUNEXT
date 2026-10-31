import {loadCalendar,eventTypes,eventStates} from '../services/monitor-calendar.service.js';
import {authorizedRooms} from '../services/monitor-students.service.js';
import {subjects} from '../data/monitor-demo.data.js';
import {validCivil} from '../utils/calendar-dates.js';
import {calendarView,agendaView,eventDetailView} from './calendar-views.js';
import {remindersView,reminderEditorView,notificationsView,notificationPreferencesView} from './organizer-personal.js';
import {errorState} from '../components/monitor-academic-ui.js';
import {escapeHTML as esc} from '../components/student-ui.js';
import {installMonitorNotifications} from '../components/notification-panel.js';
import {managementShell} from './management-shell.js';

const view = document.body.dataset.view;
const titles = {
  calendar: 'Calendario Docente',
  agenda: 'Mi Agenda Académica',
  planning: 'Planificación Semanal',
  event: 'Detalle de Actividad',
  reminders: 'Mis Recordatorios',
  reminderEdit: 'Crear / Editar Recordatorio',
  notifications: 'Notificaciones',
  preferences: 'Preferencias de Notificaciones'
};

if(/\/monitor\//.test(location.pathname)){
 const app=document.querySelector('#app'),oldHeader=document.querySelector('body>header'),shell=document.createElement('div');shell.className='monitor-shell';shell.innerHTML='<aside class="student-sidebar" aria-label="Navegación docente"></aside><div class="monitor-workspace"><header class="student-topbar"></header><main id="monitor-main"><nav class="breadcrumbs"><a href="index.html">Dashboard</a> / <a href="configuracion.html">Configuración</a></nav><h1 id="page-title"></h1><p class="demo-label">EDUNEXT · Datos de demostración</p><p id="network-notice" role="status"></p><div id="page-content"></div></main></div>';document.body.insertBefore(shell,oldHeader);shell.querySelector('#page-content').append(app);oldHeader?.remove();document.querySelector('#dialog-close').id='close-dialog';document.querySelector('#monitor-dialog').setAttribute('aria-labelledby','dialog-title');managementShell(titles[view],view==='preferences'?'settings':'calendar');
}
const dialog = document.querySelector('#monitor-dialog');
const root = document.querySelector('#app');

function open(title, html = '<p>Acción no disponible en esta demo. Requiere integración del servicio; no se han creado registros oficiales.</p>') {
  if (dialog) {
    document.querySelector('#dialog-title').textContent = title;
    document.querySelector('#dialog-content').innerHTML = html;
    dialog.showModal();
  }
}

document.querySelector('#dialog-close')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

const notifyBtn = document.querySelector('[data-open="notifications"]');
if (notifyBtn) installMonitorNotifications(notifyBtn);

const params = new URLSearchParams(location.search);
const raw = Object.fromEntries(params);

function returnToCalendar() {
  const a = document.createElement('a');
  a.href = 'calendario.html';
  a.className = 'eval-link';
  a.textContent = 'Volver al calendario';
  root.append(a);
}

try {
  const errors = [];
  if (raw.room && !authorizedRooms().some(r => r.id === raw.room)) errors.push('Aula no asignada o inexistente.');
  if (raw.grade && !['4', '5', '6'].includes(raw.grade)) errors.push('Grado no válido.');
  if (raw.course && !subjects.includes(raw.course)) errors.push('Asignatura no válida.');
  if (raw.date && !validCivil(raw.date)) errors.push('Fecha no válida.');
  if (raw.type && !Object.hasOwn(eventTypes, raw.type)) errors.push('Tipo de evento no válido.');
  if (raw.state && !Object.hasOwn(eventStates, raw.state)) errors.push('Estado no válido.');
  if ([...params.keys()].some(k => params.getAll(k).length > 1)) errors.push('Parámetros repetidos. Abre un enlace válido.');

  if (errors.length) {
    root.innerHTML = errorState(errors);
    returnToCalendar();
  } else {
    const data = await loadCalendar();
    document.title = titles[view] + ' | EDUNEXT';
    await ({
      calendar: calendarView,
      planning: calendarView,
      agenda: agendaView,
      event: eventDetailView,
      reminders: remindersView,
      reminderEdit: reminderEditorView,
      notifications: notificationsView,
      preferences: notificationPreferencesView
    }[view])({ root, open, view, raw, data });
  }
} catch (error) {
  root.innerHTML = errorState([error.message || 'No se pudieron consultar los datos locales.']);
  returnToCalendar();
}
