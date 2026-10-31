import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderEvaluationCard(item){
 const actions = {
  'disponible': `<a class="button-primary" href="detalle-evaluacion.html?id=${item.id}">Ver instrucciones</a>`,
  'programada': `<a class="button-secondary" href="detalle-evaluacion.html?id=${item.id}">Ver instrucciones</a>`,
  'en-progreso': `<a class="button-primary" href="evaluacion.html?id=${item.id}">Continuar evaluación</a>`,
  'finalizada': `<a class="button-secondary" href="resultado-evaluacion.html?id=${item.id}">Consultar estado</a>`,
  'cerrada': `<a class="button-secondary" href="detalle-evaluacion.html?id=${item.id}">Ver detalles</a>`
 };
 const statusLabel = item.status || 'disponible';
 return `<article class="eval-card">
  <header class="eval-card-head">
   <div>
    <h3 class="eval-card-title">${esc(item.title)}</h3>
    <p class="eval-card-sub">${esc(item.course)} · Grado ${item.grade}</p>
   </div>
   <span class="eval-status eval-status--${statusLabel.replace(/[^a-zA-Z0-9-]/g,'-')}">${esc(statusLabel)}</span>
  </header>
  <p class="eval-card-desc">${esc(item.description)}</p>
  <ul class="eval-meta">
   <li>${item.questionCount} preguntas</li>
   <li>${item.durationMinutes} min</li>
   <li>Disponible offline: ${item.offline?'Sí':'No'}</li>
  </ul>
  <div class="eval-card-actions">${actions[statusLabel] || actions['disponible']}</div>
 </article>`;
}
