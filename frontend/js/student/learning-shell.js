import { t, text, setLocale } from './i18n.js';
import { lt } from './learning-i18n.js';
import { learningURL, readLearningRoute } from './learning-routes.js';
import { getStudentDemo } from '../data/student-demo.data.js';
import { renderSidebar, renderBottomNav, renderMoreNavigation } from '../components/sidebar.js';
import { renderTopbar, updateConnection } from '../components/topbar.js';
import { renderNotifications } from '../components/notification-panel.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc } from '../components/student-ui.js';
import { studentSectionURL } from './section-navigation.js';
import { mountStudentGuide } from '../components/student-guide.js';

/** Controlador de las plantillas Aprende. Reutiliza los componentes del Dashboard. */
export function setupLearningShell(route,onLanguageChange,{active='courses',demoMessage,onConnectionChange}={}) {
  if(!document.querySelector('#student-shell')){
   const content=document.querySelector('#learning-content');
   document.body.classList.add('student-dashboard','learning-page');
   const template=document.createElement('div');template.innerHTML='<a class="skip-link" href="#learning-main">Ir al contenido</a><div class="student-shell" id="student-shell"><aside class="student-sidebar" id="student-sidebar"></aside><div class="student-workspace"><header class="student-topbar" id="student-topbar"></header><main class="learning-main" id="learning-main" tabindex="-1" aria-busy="true"><div id="learning-demo"></div><p id="offline-notice" hidden role="status"></p><div id="learning-loading" role="status"><span></span><span>Cargando…</span></div><footer class="student-footer"></footer></main></div></div><nav class="student-bottom-nav" id="student-bottom-nav" aria-label="Navegación"></nav><dialog id="dashboard-dialog" class="dashboard-dialog" aria-labelledby="dashboard-dialog-title"><h2 id="dashboard-dialog-title"></h2><button id="close-dialog" type="button">Cerrar</button><div id="dashboard-dialog-content"></div></dialog>';
   if(content)template.querySelector('#learning-main').insertBefore(content,template.querySelector('footer'));
   document.body.replaceChildren(...template.childNodes);
  }
 setLocale(route.lang);
 const profile=getStudentDemo(route.grade).profile;
 const shell=document.querySelector('#student-shell');
 const dialog=document.querySelector('#dashboard-dialog');
 let collapsed=matchMedia('(min-width: 761px) and (max-width: 1100px)').matches;
 function renderChrome() {
  renderSidebar(document.querySelector('#student-sidebar'),collapsed,active);
  shell.classList.toggle('is-collapsed',collapsed);
  renderTopbar(document.querySelector('#student-topbar'),profile,{headingLevel:2});
  renderBottomNav(document.querySelector('#student-bottom-nav'),active);
   document.querySelector('#learning-demo').innerHTML=`<span class="demo-badge">${t('demoShort')}</span><details class="context-disclosure"><summary>${t('sampleData')} · ${t('details')}</summary><p>${lt('sample')}</p></details>`;
    if(demoMessage)document.querySelector('#learning-demo p').textContent=demoMessage();
   let guide = document.querySelector('#student-guide');
   if (!guide) {
    guide = document.createElement('div');
    guide.id = 'student-guide';
     document.querySelector('#learning-content').after(guide);
   }
   mountStudentGuide(guide, route);
  document.querySelector('#close-dialog').setAttribute('aria-label',t('close'));
  document.querySelector('#close-dialog').innerHTML=icon('close');
  document.querySelector('.student-footer').textContent=t('footer');
  document.querySelector('.skip-link').textContent=t('skip');
  refreshConnection(navigator.onLine);
 }
 function refreshConnection(online){updateConnection(online);onConnectionChange?.(online);}
 function openDialog(title,content) {
  document.querySelector('#dashboard-dialog-title').textContent=title;
  document.querySelector('#dashboard-dialog-content').innerHTML=content;
  if(!dialog.open) dialog.showModal();
  document.querySelector('#close-dialog').focus();
 }
 function pending(title,message=t('constructionNote')) { openDialog(`${title} · ${t('construction')}`,`<p class="dialog-helper">${t('demo')}</p><p>${esc(message)}</p>`); }
  function navigateSection(section) {
   const destination = studentSectionURL(section, route);
   if (destination) { location.assign(destination); return; }
  pending(t(section),section==='downloads'?lt('offlineInfo'):t('constructionNote'));
 }
 document.addEventListener('click',event=>{
  const toggle=event.target.closest('#sidebar-toggle');
  if(toggle){collapsed=!collapsed;renderChrome();document.querySelector('#sidebar-toggle').focus();return;}
  const section=event.target.closest('[data-section]');
  if(section){navigateSection(section.dataset.section);return;}
  const opener=event.target.closest('[data-open]');
  if(opener?.dataset.open==='more') openDialog(t('more'),renderMoreNavigation(active));
  if(opener?.dataset.open==='notifications') openDialog(t('notifications'),renderNotifications(getStudentDemo(route.grade).notifications));
  if(opener?.dataset.open==='user') openDialog(t('userMenu'),`<p class="dialog-helper">${esc(profile.alias)} · ${t('demo')}</p><div class="user-options"><button type="button" data-section="profile">${icon('user')}${t('profile')}</button><button type="button" data-shell-language>${icon('globe')}${t('language')}</button><button type="button" data-section="settings">${icon('settings')}${t('settings')}</button><button type="button" data-shell-logout>${icon('logout')}${t('logout')}</button><a href="../role-selection.html">${t('backProfiles')}</a></div>`);
  if(event.target.closest('[data-shell-language]')) {dialog.close();document.querySelector('#language-select').focus();}
  if(event.target.closest('[data-shell-logout]')) openDialog(t('logout'),`<p>${t('exitDemo')}</p><a class="button-secondary dialog-link" href="../login.html">${t('goLogin')}</a>`);
 });
 document.querySelector('#close-dialog').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 document.addEventListener('change',event=>{
  if(event.target.id!=='language-select')return;
  setLocale(event.target.value);route.lang=event.target.value;
  const url=new URL(location.href);url.searchParams.set('lang',route.lang);history.replaceState(null,'',url);
  renderChrome();onLanguageChange();document.querySelector('#language-select').focus();
 });
 window.addEventListener('online',()=>refreshConnection(true));
 window.addEventListener('offline',()=>refreshConnection(false));
 matchMedia('(min-width: 761px) and (max-width: 1100px)').addEventListener('change',event=>{
  if(event.matches){collapsed=true;renderChrome();}
 });
 renderChrome();
 return {openDialog,pending,profile};
}

export function breadcrumb(items) {
 const {grade}=readLearningRoute();
 return `<nav class="learning-breadcrumb" aria-label="${lt('breadcrumb')}"><ol><li><a href="${learningURL('dashboard',{grade})}">${t('home')}</a></li>${items.map((item,index)=>`<li>${item.href?`<a href="${esc(item.href)}">${esc(item.label)}</a>`:`<span ${index===items.length-1?'aria-current="page"':''}>${esc(item.label)}</span>`}</li>`).join('')}</ol></nav>`;
}
export function showLearningError(error,route,{retry}={}) {
 const en = document.documentElement.lang === 'en';
 const missing = error.name === 'ContentNotFoundError';
 const denied = [401,403].includes(error.status);
 const root = document.querySelector('#learning-content');
 root.innerHTML=`<section class="not-found dashboard-card" role="alert"><h1 tabindex="-1">${missing?lt('notFound'):lt('loadError')}</h1><p>${missing?lt('notFoundNote'):denied?(en?'Your session or permissions do not allow this activity. Sign in again or ask your teacher for help.':'Tu sesión o tus permisos no permiten consultar esta actividad. Inicia sesión de nuevo o pide ayuda a tu docente.'):en?'Your activity could not be loaded. Check your connection and try again. No result has been created.':'No pudimos cargar tu actividad. Revisa tu conexión y vuelve a intentarlo. No se ha creado ningún resultado.'}</p><div class="recovery-actions">${!missing&&!denied&&retry?`<button type="button" class="button-primary" data-retry-learning>${en?'Try again':'Reintentar'}</button>`:''}${denied?`<a class="button-primary" href="../login.html">${en?'Sign in':'Iniciar sesión'}</a>`:''}<a class="button-secondary" href="${learningURL(route?.activity?'practice':'catalog',{grade:route?.grade??5})}">${route?.activity?(en?'Back to activities':'Volver a las actividades'):lt('backCourses')}</a><a class="button-secondary" href="${learningURL('dashboard',{grade:route?.grade??5})}">${en?'Go to home':'Ir al inicio'}</a></div></section>`;
 root.querySelector('[data-retry-learning]')?.addEventListener('click', retry);
 root.querySelector('h1').focus();
}
export function renderCourseHeader(course,extra='') {
 return `<div class="learning-course-hero tone-${course.tone}"><div class="course-emblem" aria-hidden="true">${icon(course.icon)}</div><div><span class="demo-badge">${lt('grade',{grade:course.grade})}</span><h1>${esc(text(course.name))}</h1><p>${esc(course.description)}</p><div class="hero-facts"><span>${course.unitIds.length} ${lt(course.unitIds.length===1?'unitOne':'units').toLowerCase()}</span><span>${course.lessonCount} ${lt('lessons').toLowerCase()}</span><span>${course.progress}% ${lt('progress').toLowerCase()}</span></div>${extra}</div></div>`;
}
