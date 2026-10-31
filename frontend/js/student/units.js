import { bootLearningPage } from './learning-page.js';
import { getUnit } from '../services/course.service.js';
import { lt } from './learning-i18n.js';
import { text } from './i18n.js';
import { learningURL } from './learning-routes.js';
import { breadcrumb } from './learning-shell.js';
import { learningState } from '../components/unit-card.js';
import { lessonHref } from '../components/lesson-navigation.js';
import { escapeHTML as esc, progressBar } from '../components/student-ui.js';
import { icon } from '../components/icons.js';

bootLearningPage(route=>getUnit(route.grade,route.course,route.unit),({course,unit},route,shell)=>{
 document.title=`${unit.title} | EDUNEXT`;
 const root=document.querySelector('#learning-content');
 root.innerHTML=`${breadcrumb([{label:lt('catalog'),href:learningURL('catalog',route)},{label:text(course.name),href:learningURL('course',route)},{label:unit.title}])}<header class="unit-header dashboard-card tone-${course.tone}"><span class="eyebrow-light">${esc(text(course.name))} · ${lt('grade',{grade:route.grade})}</span><h1>${esc(unit.title)}</h1><p lang="es">${esc(unit.description)}</p><div class="unit-goal"><strong>${lt('goals')}</strong><p lang="es">${esc(unit.objectives[0])}</p></div><div class="progress-caption"><span>${learningState(unit.progress)} · ${lt('offlineUnavailable')}</span><strong>${unit.progress}%</strong></div>${progressBar(unit.progress,unit.title)}</header><section aria-labelledby="unit-lessons-title"><div class="section-heading"><h2 id="unit-lessons-title">${lt('lessons')}</h2><span class="section-count">${unit.lessons.length}</span></div><div class="unit-lessons">${unit.lessons.map(lesson=>`<article class="lesson-card"><span class="unit-number">${String(lesson.number).padStart(2,'0')}</span><div><span class="status-pill">${learningState(lesson.progress)}</span><h3>${esc(lesson.title)}</h3><p lang="es">${esc(lesson.objective)}</p><small>${lt('minutes',{count:lesson.duration})} · ${lt('resources')}</small></div><a class="button-secondary" href="${lessonHref(lesson)}">${lt(lesson.progress?'resume':'start')}${icon('arrow')}</a></article>`).join('')}</div></section><section class="unit-next dashboard-card" aria-labelledby="unit-next-title"><h2 id="unit-next-title">${lt('review')}</h2><p>${lt('practiceDemo')}</p><div class="learning-actions"><button class="button-secondary" type="button" data-unit-review>${lt('review')}</button><button class="button-secondary" type="button" data-related-practice>${lt('relatedPractice')}</button><button class="button-secondary" type="button" data-unit-assessment>${lt('assessment')} · ${lt('offlinePending').split(' ')[0]}</button></div></section>`;
 root.querySelector('[data-unit-review]').addEventListener('click',()=>shell.openDialog(lt('review'),`<ol class="review-list" lang="es">${unit.lessons.map(lesson=>`<li><strong>${esc(lesson.title)}</strong><p>${esc(lesson.blocks[0].text)}</p></li>`).join('')}</ol>`));
 root.querySelector('[data-related-practice]').addEventListener('click',()=>location.assign(learningURL('practice',{...route,course:course.id,unit:unit.id})));
 root.querySelector('[data-unit-assessment]').addEventListener('click',()=>shell.pending(lt('assessment'),lt('assessmentNote')));
 root.querySelector('[data-unit-assessment]').textContent=`${lt('assessment')} · ${lt('unavailable')}`;
});
