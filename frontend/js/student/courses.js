import { bootLearningPage } from './learning-page.js';
import { getCourses } from '../services/course.service.js';
import { lt } from './learning-i18n.js';
import { learningURL } from './learning-routes.js';
import { breadcrumb } from './learning-shell.js';
import { renderCourseCards } from '../components/course-card.js';
import { escapeHTML as esc, emptyState } from '../components/student-ui.js';
let filter='all';

bootLearningPage(route=>getCourses(route.grade),(courses,route)=>{
 document.title=`${lt('catalog')} | EDUNEXT`;
 const completed=courses.reduce((sum,course)=>sum+course.completedLessons,0);
 const general=Math.round(courses.reduce((sum,course)=>sum+course.progress,0)/courses.length);
 const root=document.querySelector('#learning-content');
 root.innerHTML=`${breadcrumb([{label:lt('catalog')}])}<header class="catalog-header"><div><span class="eyebrow-light">${lt('learn')}</span><h1>${lt('catalog')}</h1><p>${lt('catalogSub')}</p></div><label class="catalog-grade" for="catalog-grade">${lt('grade',{grade:route.grade})}<select id="catalog-grade" aria-label="${lt('grade',{grade:route.grade})}">${[4,5,6].map(grade=>`<option value="${grade}" ${grade===route.grade?'selected':''}>${lt('grade',{grade})}</option>`).join('')}</select></label></header><dl class="catalog-metrics"><div><dt>${lt('grade',{grade:route.grade})}</dt><dd>${route.grade}.º</dd></div><div><dt>${lt('catalog')}</dt><dd>${courses.length}</dd></div><div><dt>${lt('completedLessons')}</dt><dd>${completed}</dd></div><div><dt>${lt('progress')}</dt><dd>${general}%</dd></div></dl><div class="catalog-filters" role="group" aria-label="${lt('filters')}">${['all','inProgress','completed','offlineFilter'].map(key=>`<button type="button" class="filter-button" data-filter="${key}" aria-pressed="${key===filter}">${lt(key)}</button>`).join('')}</div><p class="catalog-result" id="catalog-result" role="status"></p><section aria-label="${lt('catalog')}"><div id="catalog-grid" class="course-grid catalog-grid"></div></section><p class="learning-offline-note">${lt('offlineInfo')}</p>`;
 function update() {
  const visible=courses.filter(course=>filter==='all'||(filter==='inProgress'&&course.progress>0&&course.progress<100)||(filter==='completed'&&course.progress===100)||(filter==='offlineFilter'&&course.offline.downloaded&&course.offline.verified));
  root.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
  root.querySelector('#catalog-grid').innerHTML=visible.length?renderCourseCards(visible,{catalog:true,hrefForCourse:course=>learningURL('course',{grade:route.grade,course:course.id})}):emptyState(lt('empty'));
  root.querySelector('#catalog-result').textContent=lt('results',{count:visible.length});
 }
 root.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;update();}));
 root.querySelector('#catalog-grade').addEventListener('change',event=>location.assign(learningURL('catalog',{grade:event.target.value})));
 update();
});
