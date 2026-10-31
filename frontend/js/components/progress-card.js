import { t, text } from '../student/i18n.js';
import { icon } from './icons.js';
import { escapeHTML as esc, progressBar } from './student-ui.js';

export function renderSummary(summary,{compact=false}={}) {
 return [
  ['book','coursesInProgress',summary.courses,'blue'],
  ['check','lessonsCompleted',summary.lessons,'green'],
  ['award','achievements',summary.achievements,'purple'],
  ['fire','streak',`${summary.streak} <small>${t('days')}</small>`,'orange'],
 ].map(([glyph,label,value,tone])=>`<article class="summary-card ${compact?'compact-metric':'tone-'+tone}">${compact?'':`<span class="summary-icon">${icon(glyph)}</span>`}<div><p>${t(label)}</p><strong>${value}</strong></div></article>`).join('');
}
export function renderProgress(data) {
 return `<div class="overall-progress"><div class="progress-number"><strong>${data.summary.progress}%</strong><span>${t('generalProgress')}</span></div><div>${progressBar(data.summary.progress, t('generalProgress'))}<p>${data.summary.lessons} ${t('completedLessons')} · ${data.summary.activities} ${t('activities')}</p></div></div><div class="subject-progress">${data.courses.map(course=>`<div class="subject-progress-item tone-${course.tone}"><span>${esc(text(course.name))}</span><strong>${course.progress}%</strong>${progressBar(course.progress, `${t('courseProgress')} · ${text(course.name)}`)}</div>`).join('')}</div>`;
}
