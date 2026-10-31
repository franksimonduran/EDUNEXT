import { t, text } from '../student/i18n.js';
import { icon } from './icons.js';
import { escapeHTML as esc, progressBar, emptyState } from './student-ui.js';
import { lt } from '../student/learning-i18n.js';

export function renderCourseCards(courses, { catalog = false, hrefForCourse } = {}) {
 if (!courses.length) return emptyState(t('emptyCourses'));
 return courses.map(course => {
  const illustrationLabel = catalog
   ? `role="img" aria-label="${esc(course.image.description)}"` : 'aria-hidden="true"';
  const metadata = catalog ? `
   <p class="course-topic" lang="es">${esc(text(course.topic))}</p>
   <small>${course.unitIds.length} ${lt(course.unitIds.length === 1 ? 'unitOne' : 'units').toLowerCase()} · ${course.lessonCount} ${lt('lessons').toLowerCase()}</small>` : '';
  const action = catalog
   ? `<a class="course-action" href="${esc(hrefForCourse(course))}" aria-label="${lt('viewCourse')} · ${esc(text(course.name))}">${lt('viewCourse')}${icon('arrow')}</a>`
   : `<button class="course-action" type="button" data-course="${course.id}" aria-label="${t(course.progress ? 'continue' : 'explore')} · ${esc(text(course.name))}">${t(course.progress ? 'continue' : 'explore')}${icon('arrow')}</button>`;
  return `<article class="course-card tone-${course.tone}">
   <div class="course-art" ${illustrationLabel}>${icon(course.icon)}<span class="art-circle"></span><span class="art-dot"></span></div>
   <div class="course-content">
    <span class="course-grade">${t('grade', {grade: course.grade})}</span>
    <h3>${esc(text(course.name))}</h3><p>${esc(catalog ? course.description : text(course.topic))}</p>${metadata}
    <div class="progress-caption"><span>${t('progressLabel')}</span><strong>${course.progress}%</strong></div>
    ${progressBar(course.progress, `${text(course.name)} · ${t('progressLabel')}`)}
    <div class="course-bottom"><span class="download-state">${icon('download')}${t('notDownloaded')}</span>${action}</div>
   </div>
  </article>`;
 }).join('');
}
