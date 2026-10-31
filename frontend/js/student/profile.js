import { bootLearningPage } from './learning-page.js';
import { getProfile } from '../data/profile-demo.data.js';
import { renderProfileHeader } from '../components/profile-header.js';
import { icon } from '../components/icons.js';
import { getProgress } from '../data/progress-demo.data.js';
import { listAchievements } from '../data/achievements-demo.data.js';
import { t } from '../i18n/i18n.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = `${t('profileTitle')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 const profile = getProfile();
 const prog = getProgress({grade: profile.grade});
 const ach = listAchievements();

 root.innerHTML = `${renderProfileHeader(profile)}
 <section class="prof-summary">
  <article class="prof-sum-card"><div><div>${t('courses')}</div><strong>${profile.coursesActive}</strong></div><a href="aprende.html?grade=${profile.grade}">${icon('book')}</a></article>
  <article class="prof-sum-card"><div><div>${t('lessons')}</div><strong>${prog.general.completedLessons}</strong></div><a href="progreso.html?grade=${profile.grade}">${icon('chart')}</a></article>
  <article class="prof-sum-card"><div><div>${t('missions')}</div><strong>${profile.missionsCompleted}</strong></div><a href="misiones.html?grade=${profile.grade}">${icon('target')}</a></article>
  <article class="prof-sum-card"><div><div>${t('achievements')}</div><strong>${ach.filter(a=>a.status==='obtenida').length}</strong></div><a href="logros.html">${icon('award')}</a></article>
 </section>
 <section>
  <h2>${t('myAchievements')}</h2>
  <div class="prof-grid">${ach.slice(0,3).map(a=>`<article class="prof-card"><h3>${a.name}</h3><p>${a.desc}</p></article>`).join('')}</div>
  <p><a href="logros.html">${t('seeAll')}</a></p>
 </section>
 <section>
  <h2>${t('myCourses')}</h2>
  <div class="prof-grid">${prog.courses.map(c=>`<article class="prof-card"><h3>${c.course}</h3><p>${c.percent}%</p><a class="button-secondary" href="progreso-curso.html?course=${encodeURIComponent(c.course)}&grade=${c.grade}">${t('seeCourse')}</a></article>`).join('')}</div>
 </section>`;
  root.querySelectorAll('.prof-sum-card a').forEach(a=>a.setAttribute('aria-label',a.closest('article').textContent.trim()));
  return ()=>{};
},{active:'profile',demoMessage:()=> t('savedLocal')});
