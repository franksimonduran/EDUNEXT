import {escapeHTML as esc} from './student-ui.js';
import {text} from '../student/i18n.js';
import {tt} from '../student/tutor-i18n.js';
import {learningURL} from '../student/learning-routes.js';
export function renderTutorContext(context,grade,selected){
 if(!context)return `<p class="context-empty">${tt('noContext')}</p><p>${tt('general')}</p><dl><div><dt>${tt('grade')}</dt><dd>${grade}.º primaria</dd></div></dl>${selected?`<div class="selected-demo-context"><strong>${tt('selectedExample')}</strong><p lang="es">${esc(selected.title)}</p></div>`:''}`;
 return `<span class="context-kicker">${tt('studying')}</span><dl>${[[tt('grade'),`${grade}.º primaria`],[tt('course'),text(context.subject)],[tt('unit'),context.unitTitle],[tt('lesson'),context.title],[tt('theme'),context.topic]].map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><a class="button-secondary" href="${learningURL('lesson',{grade,course:context.courseId,unit:context.unitId,lesson:context.lessonId})}">${tt('backLesson')}</a>`;
}
