import { bootLearningPage } from './learning-page.js';
import { getCourse } from '../services/course.service.js';
import { lt } from './learning-i18n.js';
import { text } from './i18n.js';
import { learningURL } from './learning-routes.js';
import { breadcrumb, renderCourseHeader } from './learning-shell.js';
import { renderUnitCard } from '../components/unit-card.js';
import { lessonHref } from '../components/lesson-navigation.js';
import { escapeHTML as esc, progressBar } from '../components/student-ui.js';
import { icon } from '../components/icons.js';

bootLearningPage(route=>getCourse(route.grade,route.course),(course,route,shell)=>{
 document.title=`${text(course.name)} | EDUNEXT`;
 const lessons=course.units.flatMap(unit=>unit.lessons);
 const resume=lessons.find(lesson=>lesson.progress<100)??lessons[0];
 const root=document.querySelector('#learning-content');
 root.innerHTML=`${breadcrumb([{label:lt('catalog'),href:learningURL('catalog',route)},{label:text(course.name)}])}${renderCourseHeader(course,`<a class="button-primary continue-course" href="${lessonHref(resume)}">${lt('continue')}${icon('arrow')}</a>`)}<div class="course-detail-layout"><div><section class="dashboard-card course-objectives"><h2>${lt('goals')}</h2><ul lang="es">${course.objectives.map(goal=>`<li>${esc(goal)}</li>`).join('')}</ul><h3>${lt('topics')}</h3><p lang="es">${esc(text(course.topic))}</p></section><section class="unit-section" aria-labelledby="units-title"><div class="section-heading"><h2 id="units-title">${lt('units')}</h2><span class="section-count">${course.units.length}</span></div><div class="unit-list">${course.units.map(renderUnitCard).join('')}</div></section></div><aside class="dashboard-card course-overview" aria-labelledby="course-summary-title"><h2 id="course-summary-title">${lt('summary')}</h2><strong class="course-percentage">${course.progress}%</strong>${progressBar(course.progress,text(course.name))}<dl><div><dt>${lt('units')}</dt><dd>${course.units.length}</dd></div><div><dt>${lt('lessons')}</dt><dd>${lessons.length}</dd></div><div><dt>${lt('completedLessons')}</dt><dd>${course.completedLessons}</dd></div><div><dt>${lt('pendingActivities')}</dt><dd>${lessons.length-course.completedLessons}</dd></div></dl><button class="button-secondary download-course" type="button" id="download-course">${icon('download')}${lt('download')}</button><p>${lt('offlinePending')}</p></aside></div>`;
 root.querySelector('#download-course').addEventListener('click',()=>shell.pending(lt('download'),lt('offlineInfo')));
});
