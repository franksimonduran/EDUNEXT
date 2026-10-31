import { lt } from '../student/learning-i18n.js';
import { learningURL } from '../student/learning-routes.js';
import { escapeHTML as esc, progressBar } from './student-ui.js';
import { icon } from './icons.js';

export function learningState(value,available=true) { return lt(!available?'unavailable':value===100?'completedState':value>0?'inProgressState':'notStarted'); }
export function renderUnitCard(unit) {
 const available=unit.availability.available;
 return `<article class="unit-card"><span class="unit-number">${String(unit.number).padStart(2,'0')}</span><div class="unit-copy"><span class="status-pill">${learningState(unit.progress,available)}</span><h3>${esc(unit.title)}</h3><p>${esc(unit.description)}</p><small>${unit.lessonIds.length} ${lt('lessons').toLowerCase()} · ${lt('offlineUnavailable')}</small><div class="progress-caption"><span>${lt('progress')}</span><strong>${unit.progress}%</strong></div>${progressBar(unit.progress,unit.title)}</div>${available?`<a class="button-secondary" href="${learningURL('unit',{grade:unit.grade,course:unit.courseId,unit:unit.id})}">${lt('viewUnit')}${icon('arrow')}</a>`:`<button class="button-secondary" disabled>${lt('unavailable')}</button><p>${esc(unit.availability.reason)}</p>`}</article>`;
}
