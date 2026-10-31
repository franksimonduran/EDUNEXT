import { escapeHTML as esc } from './student-ui.js';
import {referenceMonitor,referenceAdmin} from './reference-dashboard.js';

// Recompose known, freshly rendered dashboard nodes. All original records and
// controls are moved, not discarded; service state and delegated events remain.
function disclosure(title, nodes, className = 'workspace-disclosure', open = false) {
  const details = document.createElement('details');
  details.className = className;
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = title;
  const body = document.createElement('div');
  body.className = 'disclosure-body';
  body.append(...nodes.filter(Boolean));
  details.append(summary, body);
  return details;
}

export function revealDashboardSection(target) {
  if (!target) return;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ block: 'start' });
  target.focus({ preventScroll: true });
}

export function composeMonitorDashboard(root, { pending, pendingStudents, scheduled, preferences, snapshot }) {
  const hero = root.querySelector('.monitor-hero');
  const grid = root.querySelector('.monitor-grid');
  const metrics = root.querySelector('[aria-label="Resumen académico"]');
  const contentMetrics = root.querySelector('[aria-label="Contenidos educativos"]');
  if (!hero || !grid || !metrics) return;
  const names = ['performance', 'progress', 'classrooms', 'upcoming', 'support', 'insights', 'activity', 'notices', 'tools'];
  const sections = Object.fromEntries([...grid.children].map((section, index) => {
    section.id = `monitor-${names[index]}`;
    return [names[index], section];
  }));
  const priorities = document.createElement('section');
  priorities.className = 'operational-priorities';
  priorities.setAttribute('aria-labelledby', 'monitor-priorities-title');
  priorities.innerHTML = `<div class="section-heading"><div><h2 id="monitor-priorities-title">Prioridades de seguimiento</h2><p>Registros locales de demostración</p></div></div><div class="priority-grid">${[
    ['Intentos por revisar', pending, 'grades', 'Revisar resultados'],
    ['Estudiantes con actividades pendientes', pendingStudents, 'students', 'Ver estudiantes'],
    ['Evaluaciones programadas localmente', scheduled, 'evaluations', 'Consultar evaluaciones'],
  ].map(([label, count, module, action]) => `<article class="priority-item"><p>${esc(label)}</p><strong>${esc(count)}</strong><button type="button" class="text-button" data-module="${module}">${action}</button></article>`).join('')}</div>`;
  const activityRecords = [...(sections.activity?.querySelectorAll('.record') ?? [])];
  if (activityRecords.length > 3) sections.activity.append(disclosure('Ver más actividad', activityRecords.slice(3), 'record-disclosure'));
  const operational = document.createElement('div');
  operational.className = 'operational-grid';
  operational.append(...[sections.upcoming, sections.activity].filter(Boolean));
  const actions = hero.querySelector('.actions');
  hero.replaceChildren(...[actions].filter(Boolean));
  hero.classList.add('workspace-shortcuts');
  hero.setAttribute('aria-label', 'Accesos de gestión docente');
  const tools = root.querySelector('.dashboard-tools');
  const analysis = disclosure('Análisis académico y seguimiento de aulas', [grid], 'workspace-disclosure', preferences.dashboardSection === 'classrooms');
  const studio = disclosure('Catálogo y borradores de contenido', [contentMetrics], 'workspace-disclosure', preferences.dashboardSection === 'content');
   root.replaceChildren(priorities, operational, metrics, analysis, studio, hero, ...[tools].filter(Boolean));
   if(snapshot)referenceMonitor(root,{...snapshot,preferences});
}

export function composeAdminDashboard(root, { administrative, organization, snapshot }) {
  const metrics = root.querySelector('[aria-labelledby="admin-metrics-title"]');
  const hero = root.querySelector('.admin-hero');
  const columns = root.querySelector('.admin-columns');
  if (!metrics || !hero || !columns) return;
  const alertTarget = root.querySelector('#admin-alerts');
  const alertSection = alertTarget?.closest('section');
  const otherNodes = [...root.children].filter(node => ![metrics, hero, columns, administrative, organization, alertSection].includes(node));
  const priorityGrid = document.createElement('div');
  priorityGrid.className = 'management-grid';
  const attention = document.createElement('section');
  attention.className = 'management-attention';
  attention.setAttribute('aria-label', 'Avisos y propuestas locales');
  attention.append(...[alertSection, administrative].filter(Boolean));
  priorityGrid.append(attention, organization);
  const actions = hero.querySelector('.actions');
  hero.replaceChildren(...[actions].filter(Boolean));
  hero.classList.add('workspace-shortcuts');
  hero.setAttribute('aria-label', 'Consultar detalles del resumen');
  const detail = disclosure('Distribución, actividad y estado de la plataforma', [columns], 'workspace-disclosure');
  const institution = disclosure('Información institucional y alcance de las muestras', otherNodes, 'workspace-disclosure');
   root.replaceChildren(metrics, priorityGrid, hero, detail, institution);
   if(snapshot)referenceAdmin(root,snapshot);
}
