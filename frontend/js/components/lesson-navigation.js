import { lt } from '../student/learning-i18n.js';
import { learningURL } from '../student/learning-routes.js';
import { escapeHTML as esc } from './student-ui.js';
import { learningState } from './unit-card.js';

export function lessonHref(lesson) { return learningURL('lesson',{grade:lesson.grade,course:lesson.courseId,unit:lesson.unitId,lesson:lesson.id}); }
export function renderLessonIndex(unit,currentId) {
 return `<details class="lesson-index" open><summary>${lt('index')}</summary><nav aria-label="${lt('index')}"><ol>${unit.lessons.map(lesson=>`<li><a href="${lessonHref(lesson)}" ${lesson.id===currentId?'aria-current="page"':''}><span class="lesson-index-number">${lesson.number}</span><span>${esc(lesson.title)}<small>${lesson.id===currentId?lt('current'):learningState(lesson.progress)}</small></span></a></li>`).join('')}</ol></nav></details>`;
}
export function renderLessonNavigation(unit,lesson) {
 const index=unit.lessons.findIndex(item=>item.id===lesson.id);
 const previous=unit.lessons[index-1],next=unit.lessons[index+1];
 return `<nav class="lesson-pagination" aria-label="${lt('lessons')}">${previous?`<a class="button-secondary" data-previous href="${lessonHref(previous)}">← ${lt('previous')}</a>`:`<button class="button-secondary" disabled>${lt('previous')}</button>`}<a class="button-secondary" href="${learningURL('unit',{grade:unit.grade,course:unit.courseId,unit:unit.id})}">${lt('backUnit')}</a>${next?`<a class="button-primary" data-next href="${lessonHref(next)}">${lt('next')} →</a>`:`<a class="button-primary" href="${learningURL('unit',{grade:unit.grade,course:unit.courseId,unit:unit.id})}">${lt('backUnit')}</a>`}</nav>`;
}
