import { loadStudentDemo } from '../services/student.service.js';
import { t, text, setLocale } from './i18n.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc, progressBar, emptyState } from '../components/student-ui.js';
import { renderSidebar, renderBottomNav, renderMoreNavigation } from '../components/sidebar.js';
import { renderTopbar, updateConnection } from '../components/topbar.js';
import { renderCourseCards } from '../components/course-card.js';
import { renderSummary, renderProgress } from '../components/progress-card.js';
import { renderNotifications } from '../components/notification-panel.js';
import { learningURL, readLearningRoute } from './learning-routes.js';
import { getCourse } from '../services/course.service.js';
import { lessonHref } from '../components/lesson-navigation.js';
import { studentSectionURL } from './section-navigation.js';
import { mountStudentGuide } from '../components/student-guide.js';

const shell = document.querySelector('#student-shell');
const main = document.querySelector('#dashboard-main');
const dialog = document.querySelector('#dashboard-dialog');
const gradeSelect = document.querySelector('#grade-select');
let data;
let busy = false;
let collapsed = matchMedia('(min-width: 761px) and (max-width: 1100px)').matches;
let initialGrade = 5;
try {
 const initial = readLearningRoute();
 initialGrade = initial.grade;
 setLocale(initial.lang);
} catch { /* Un parámetro inválido no altera el perfil de muestra por defecto. */ }
gradeSelect.value = String(initialGrade);

function translateStatic() {
 document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
 document.title = `${t('dashboard')} | EDUNEXT`;
 for (const option of gradeSelect.options) option.textContent = t('grade', {grade: option.value});
 document.querySelector('#academic-summary').setAttribute('aria-label', `${t('demo')} · ${t('overview')}`);
 document.querySelector('#activity-column').setAttribute('aria-label', `${t('planner')} · ${t('recentActivity')}`);
 document.querySelector('#close-dialog').setAttribute('aria-label', t('close'));
}

function renderHero() {
 const course = data.courses.find(course => course.id === data.continueLearning.course);
 const hero = data.continueLearning;
 document.querySelector('#continue-learning').innerHTML = `<div class="continue-copy"><p class="eyebrow">${esc(text(course.name))} · ${t('grade',{grade:data.profile.grade})}</p><h2 id="continue-title">${esc(text(hero.lesson))}</h2><p class="hero-lesson">${t('unit')}: ${esc(text(course.topic))}</p><div class="hero-progress"><span>${t('progressLabel')} · ${t('sample')}</span><strong>${hero.progress}%</strong></div>${progressBar(hero.progress,t('continueTitle'))}<button class="hero-button button-primary" type="button" data-course="${course.id}"><span>${t('continueLearning')}</span>${icon('arrow')}</button></div>`;
 document.querySelector('#continue-learning .hero-button').dataset.continueLesson = '';
}

function renderMission() {
 const mission = data.mission;
 const done = mission.tasks.filter(task=>task.done).length;
 document.querySelector('#mission-card').innerHTML = `<div class="mission-heading"><span class="list-icon tone-orange">${icon('target')}</span><span class="reward-pill">${t('reward',{points:mission.reward})}</span></div><h2 id="mission-title">${t('todayMission')}</h2><p class="card-subtitle">${t('dailyChallenge')}</p><ul class="mission-list">${mission.tasks.map(task=>`<li><span class="task-mark ${task.done?'is-done':''}" aria-hidden="true">${task.done?icon('check'):''}</span><span>${esc(text(task.label))}<span class="sr-only"> · ${task.done?t('completed'):t('pending')}</span></span></li>`).join('')}</ul><p class="mission-caption">${t('missionProgress',{done,total:mission.tasks.length})}</p>${progressBar(Math.round(done/mission.tasks.length*100),t('todayMission'))}<p class="mission-footnote">${t('missionReadOnly')}</p>`;
}

function renderActivity() {
 document.querySelector('#recent-activity').innerHTML = data.activities.length ? `<ul class="activity-list">${data.activities.map(item=>`<li><span class="activity-marker">${icon(item.icon)}</span><div><h3>${esc(text(item.title))}</h3><p>${esc(text(item.course))} · ${esc(text(item.detail))}</p><small>${esc(text(item.when))}</small><span class="activity-state">${esc(text(item.state))}</span></div></li>`).join('')}</ul>` : emptyState(t('noActivity'));
 document.querySelector('#upcoming-evaluations').innerHTML = data.evaluations.length ? data.evaluations.map(item=>`<article class="evaluation-item"><div class="evaluation-date" aria-hidden="true"><strong>${item.day}</strong><span>${esc(text(item.month))}</span></div><div class="evaluation-copy"><h3>${esc(text(item.course))}</h3><p>${esc(text(item.topic))}</p><p class="evaluation-time">${esc(text(item.date))} · ${item.time}</p></div><button type="button" class="text-button" data-evaluation="${item.id}" aria-label="${esc(t('details')+' · '+text(item.course))}">${t('details')}${icon('arrow')}</button></article>`).join('') : emptyState(t('noEvaluations'));
}

function renderQuickAccess() {
 const items = [['tutor','tutor','tutorName','tutorHelp','blue'],['translator','language','translateName','translateHelp','purple'],['pronunciation','mic','pronounceName','pronounceHelp','pink'],['assessments','clipboard','assessmentsName','assessmentsHelp','orange'],['downloads','download','offlineName','offlineHelp','green']];
 document.querySelector('#quick-access').innerHTML = items.map(([section,glyph,name,help,tone])=>`<button class="quick-card tone-${tone}" type="button" data-section="${section}"><span class="list-icon">${icon(glyph)}</span><span><strong>${t(name)}</strong><small>${t(help)}</small></span>${icon('arrow','quick-arrow')}</button>`).join('');
}

function renderAll() {
 translateStatic();
 renderSidebar(document.querySelector('#student-sidebar'),collapsed);
 shell.classList.toggle('is-collapsed',collapsed);
 renderTopbar(document.querySelector('#student-topbar'),data.profile);
 renderBottomNav(document.querySelector('#student-bottom-nav'));
 document.querySelector('#academic-summary').innerHTML = renderSummary(data.summary,{compact:true});
 document.querySelector('#course-grid').innerHTML = renderCourseCards(data.courses);
 document.querySelector('#progress-content').innerHTML = renderProgress(data);
  renderHero(); renderMission(); renderActivity(); renderQuickAccess();
  let guide = document.querySelector('#student-guide');
  if (!guide) {
   guide = document.createElement('div');
   guide.id = 'student-guide';
    document.querySelector('.dashboard-tools-section').after(guide);
  }
  mountStudentGuide(guide, { grade: data.profile.grade });
 updateConnection(navigator.onLine);
}

async function loadDashboard(grade = 5) {
 if (busy) return;
 busy = true;
 main.setAttribute('aria-busy','true');
 gradeSelect.disabled = true;
 document.querySelector('#dashboard-loading').hidden = false;
 document.querySelector('#dashboard-error').hidden = true;
 try {
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  data = await loadStudentDemo(grade);
  renderAll();
  document.querySelector('#dashboard-content').hidden = false;
 } catch {
  document.querySelector('#dashboard-content').hidden = true;
  document.querySelector('#dashboard-error').hidden = false;
 } finally {
  document.querySelector('#dashboard-loading').hidden = true;
  main.setAttribute('aria-busy','false');
  busy = false;
 gradeSelect.disabled = false;
 }
}

function openDialog(title, content, kind = 'details') {
 document.querySelector('#dashboard-dialog-title').textContent = title;
 document.querySelector('#dashboard-dialog-content').innerHTML = content;
 dialog.dataset.kind = kind;
 document.querySelector('#close-dialog').innerHTML = icon('close');
 if (!dialog.open) dialog.showModal();
 document.querySelector('#close-dialog').focus();
}

function handleSection(section) {
 if (!data) return;
 const destination = studentSectionURL(section, { grade: data.profile.grade });
 if (destination) { location.assign(destination); return; }
 openDialog(`${t(section)} · ${t('construction')}`,`<p class="dialog-helper">${t('demo')}</p><div class="construction-icon">${icon(section==='downloads'?'download':'spark')}</div><p>${section==='downloads'?t('noDownloads'):t('constructionNote')}</p>`);
}

document.addEventListener('click',async event=>{
 const toggle = event.target.closest('#sidebar-toggle');
 if (toggle && data) {
  collapsed = !collapsed;
  shell.classList.toggle('is-collapsed',collapsed);
  renderSidebar(document.querySelector('#student-sidebar'),collapsed);
  document.querySelector('#sidebar-toggle').focus();
  return;
 }
 const section = event.target.closest('[data-section]');
 if (section) { handleSection(section.dataset.section); return; }
 const opener = event.target.closest('[data-open]');
  if (opener && data) {
   if (opener.dataset.open==='guide') {
    openDialog(t('guideAction'),document.querySelector('#student-guide').innerHTML,'guide');
    const guide = document.querySelector('#dashboard-dialog-content details');
    if (guide) guide.open = true;
   }
  if (opener.dataset.open==='notifications') openDialog(t('notifications'),renderNotifications(data.notifications),'notifications');
  if (opener.dataset.open==='more') openDialog(t('more'),renderMoreNavigation(),'more');
  if (opener.dataset.open==='user') openDialog(t('userMenu'),`<p class="dialog-helper">${esc(data.profile.alias)} · ${t('grade',{grade:data.profile.grade})} · ${t('demo')}</p><div class="user-options"><button type="button" data-section="profile">${icon('user')}${t('profile')}</button><button type="button" data-user-action="language">${icon('globe')}${t('language')}</button><button type="button" data-section="settings">${icon('settings')}${t('settings')}</button><button type="button" data-user-action="logout">${icon('logout')}${t('logout')}</button><a href="../role-selection.html">${icon('chevron')}${t('backProfiles')}</a></div>`,'user');
  return;
 }
 const courseButton = event.target.closest('[data-course]');
 if (courseButton && data) {
   const id=courseButton.dataset.course;
   if (!data.courses.some(course=>course.id===id)) return;
   if (courseButton.hasAttribute('data-continue-lesson')) {
    courseButton.disabled=true;
    try {
     const course=await getCourse(data.profile.grade,id);
     const lessons=course.units.flatMap(unit=>unit.lessons);
     location.assign(lessonHref(lessons.find(lesson=>lesson.progress<100)??lessons[0]));
    } catch {
     courseButton.disabled=false;
     openDialog(t('loadError'),`<p>${t('retry')}</p>`);
    }
   } else location.assign(learningURL('course',{grade:data.profile.grade,course:id}));
  return;
 }
 const evaluationButton = event.target.closest('[data-evaluation]');
 if (evaluationButton && data) {
  const item=data.evaluations.find(item=>item.id===evaluationButton.dataset.evaluation);
  if(item) openDialog(`${t('evaluation')} · ${text(item.course)}`,`<span class="upcoming-pill">${t('comingSoon')}</span><h3 class="dialog-topic">${esc(text(item.topic))}</h3><p>${esc(text(item.date))} · ${item.time}</p><p class="notice">${t('evaluationNote')}</p>`);
  return;
 }
 const action = event.target.closest('[data-user-action]');
 if (action?.dataset.userAction==='language') {
  dialog.close(); document.querySelector('#language-select').focus();
 }
 if (action?.dataset.userAction==='logout') openDialog(t('logout'),`<p>${t('exitDemo')}</p><a class="button-secondary dialog-link" href="../login.html">${t('goLogin')}</a>`);
});

document.querySelector('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{
 if (event.target!==dialog) return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) dialog.close();
});
document.addEventListener('change',event=>{
  if(event.target.id==='grade-select') {
   const url = new URL(location.href);
   url.searchParams.set('grade', gradeSelect.value);
   history.replaceState(null, '', url);
   loadDashboard(Number(gradeSelect.value));
  }
 if(event.target.id==='language-select' && data) {
   setLocale(event.target.value);
   const url = new URL(location.href);
   url.searchParams.set('lang', event.target.value);
   history.replaceState(null, '', url);
  renderAll();
  document.querySelector('#language-select').focus();
 }
});
document.querySelector('#retry-dashboard').addEventListener('click',()=>loadDashboard(Number(gradeSelect.value)));
window.addEventListener('online',()=>updateConnection(true));
window.addEventListener('offline',()=>updateConnection(false));
matchMedia('(min-width: 761px) and (max-width: 1100px)').addEventListener('change',event=>{
 if(event.matches && data) { collapsed=true; shell.classList.add('is-collapsed'); renderSidebar(document.querySelector('#student-sidebar'),collapsed); }
});
loadDashboard(initialGrade);
