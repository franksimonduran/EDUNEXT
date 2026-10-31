import { t, getLocale } from '../student/i18n.js';
import { icon } from './icons.js';
import { escapeHTML } from './student-ui.js';
import {installMonitorNotifications} from './notification-panel.js';
import {monitorIdentity} from '../services/monitor-profile.service.js';
import {renderAvatar} from './avatar-selector.js';
import {t as uiT} from '../i18n/i18n.js';
const boundMonitorTopbars=new WeakSet();
const navigationObservers = new WeakMap();

export function renderTopbar(container, profile, { headingLevel = 2, role = 'student' } = {}) {
  document.body.classList.add('corporate-ui');
  if(role === 'monitor'||role==='admin') {
   const admin=role==='admin';
   if(!admin&&!boundMonitorTopbars.has(container)){boundMonitorTopbars.add(container);window.addEventListener('aithron-preferences-change',event=>{if(event.detail.scope!=='demo-monitor'||!container.isConnected)return;const p=monitorIdentity(),alias=container.querySelector('[data-monitor-alias]'),avatar=container.querySelector('.monitor-avatar');if(alias?.firstChild)alias.firstChild.textContent=p.alias;if(avatar){avatar.innerHTML=renderAvatar(p.avatar);avatar.className='avatar-button monitor-avatar tone-'+p.avatarTone;}});}
   if(!admin)profile=monitorIdentity();const en=document.documentElement.lang==='en',greeting=admin?(en?'Administration':'Administración'):profile.greeting==='friendly'?uiT('m.friendlyGreeting'):profile.greeting==='brief'?'EDUNEXT':(en?'Teaching workspace':'Espacio docente'),roleLabel=admin?profile.roleLabel:uiT('m.role');
   const avatar=admin?`<button type="button" class="avatar-button monitor-avatar tone-blue" data-open="user" aria-label="${uiT('m.profileMenu')}">${renderAvatar(profile.avatar)}</button>`:`<a class="avatar-button monitor-avatar tone-${profile.avatarTone}" href="perfil.html" aria-label="${uiT('m.profile')}">${renderAvatar(profile.avatar)}</a>`;
   container.innerHTML = `<div class="topbar-greeting"><button type="button" class="icon-button" data-open="navigation" aria-label="${uiT('m.settings')}">${icon('menu')}</button><div><h2>${escapeHTML(greeting)}</h2></div></div><div class="topbar-actions"><span id="connection-indicator" role="status"></span><button type="button" class="icon-button" data-open="notifications" aria-label="${uiT('m.notifications')}">${icon('bell')}</button>${avatar}<span data-monitor-alias>${escapeHTML(profile.alias)}<small>${escapeHTML(roleLabel)} · ${escapeHTML(profile.institution)}</small></span>${admin?'':`<button type="button" data-open="user" aria-label="${uiT('m.settings')}">${icon('chevron')}</button>`}</div>`;
    const contextCaption = document.createElement('p');
    contextCaption.className = 'topbar-context';
    container.querySelector('.topbar-greeting > div').append(contextCaption);
    container.querySelector('[data-open="notifications"]').setAttribute('aria-label',uiT('m.notificationBell'));
    const menu = container.querySelector('[data-open="navigation"]');
    menu.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Open navigation menu' : 'Abrir menú de navegación');
    menu.setAttribute('aria-expanded', 'false');
    const shell = container.closest('.monitor-shell');
    const sidebar = shell?.querySelector('.student-sidebar');
    if (sidebar?.id) menu.setAttribute('aria-controls', sidebar.id);
    navigationObservers.get(container)?.disconnect();
    if (shell) {
     const updateExpanded = () => menu.setAttribute('aria-expanded', String(shell.classList.contains('menu-open')));
     const observer = new MutationObserver(updateExpanded);
     observer.observe(shell, { attributes: true, attributeFilter: ['class'] });
     navigationObservers.set(container, observer);
     updateExpanded();
    }
   container.querySelector('[data-open="user"]').setAttribute('aria-label',uiT('m.profileMenu'));
   if(!admin)installMonitorNotifications(container.querySelector('[data-open="notifications"]'));
  return;
 }
 const heading = headingLevel === 2 ? 'h2' : 'h1';
  container.innerHTML = `<div class="topbar-greeting"><button type="button" class="icon-button more-button" data-open="more" aria-label="${t('menu')}" aria-haspopup="dialog" aria-controls="dashboard-dialog">${icon('menu')}</button><div><${heading}>${t('workspaceTitle')}</${heading}><p>${t('workspaceSubtitle')}</p></div></div><div class="topbar-actions"><span class="grade-pill">${t('grade', { grade: profile.grade })}</span><label class="language-control"><span class="sr-only">${t('language')}</span>${icon('globe')}<select id="language-select" aria-label="${t('language')}"><option value="es" ${getLocale()==='es'?'selected':''}>Español</option><option value="en" ${getLocale()==='en'?'selected':''}>English</option></select></label><span id="connection-indicator" class="connection-indicator" title="${t('connectionHelp')}"></span><button type="button" class="icon-button notification-button" data-open="notifications" aria-label="${t('notifications')}" aria-haspopup="dialog" aria-controls="dashboard-dialog">${icon('bell')}<span class="notification-dot" aria-hidden="true"></span></button><button type="button" class="avatar-button" data-open="user" aria-label="${t('userMenu')}" aria-haspopup="dialog" aria-controls="dashboard-dialog">${escapeHTML(profile.initials)}</button></div>`;
}
export function updateConnection(online) {
 const indicator = document.querySelector('#connection-indicator');
 if (!indicator) return;
 indicator.dataset.online = String(online);
 indicator.innerHTML = `${icon(online ? 'wifi' : 'offline')}<span>${t(online ? 'online' : 'offline')}</span>`;
 const notice = document.querySelector('#offline-notice');
  if (notice) {
   notice.hidden = online;
   notice.textContent = `${t('offlineNote')} ${t('offlineLimit')}`;
  }
}
