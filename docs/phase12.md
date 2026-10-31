# FASE 12 - AGENDA, CALENDARIO Y ACTIVIDADES PENDIENTES

## Alcance
Calendario mensual, vista de eventos por día, actividades pendientes, detalle de evento y recordatorios personales (modo demostrativo).

## Archivos creados
- Datos: `frontend/js/data/agenda-demo.data.js`, `reminders-demo.data.js`
- Utils: `calendar-dates.js`, `event-filter.js`, `event-status.js`, `date-format.js`
- Servicios: `agenda.service.js`, `calendar.service.js`, `reminder.service.js`
- Componentes: `calendar-month.js`, `calendar-week.js`, `calendar-event.js`, `agenda-list.js`, `event-card.js`, `event-filters.js`, `activity-card.js`, `reminder-card.js`, `reminder-form.js`
- CSS: `frontend/css/student/agenda.css`
- Páginas: `agenda.html/js`, `actividades-pendientes.html/js`, `detalle-evento.html/js`, `recordatorios.html/js`, `editar-recordatorio.html/js`

## Archivos modificados
- `frontend/js/components/sidebar.js` (Agenda)
- `frontend/js/student/learning-routes.js` (rutas Agenda)

## Notas
- Calendario funcional (mensual), navegación anterior/siguiente/Hoy, selección de día
- Eventos derivados de evaluaciones/aprende/misiones/vocabulario
- Recordatorios personales locales
- Responsive y accesible
- Sin notificaciones push, preparado offline
