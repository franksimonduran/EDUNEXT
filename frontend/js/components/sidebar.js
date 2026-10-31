import { t } from '../student/i18n.js';
import { icon } from './icons.js';
import { config } from '../core/config.js';
import {t as uiT,getLocale as profileLocale} from '../i18n/i18n.js';
import { studentSectionURL, canonicalSection } from '../student/section-navigation.js';

export const studentSections = Object.freeze([
 ['home', 'home'], ['courses', 'book'], ['practice', 'practice'], ['games', 'games'], ['evaluations', 'clipboard'], ['agenda', 'calendar'], ['progress', 'chart'], ['missions', 'target'], ['achievements', 'award'], ['downloads', 'download'], ['tutor', 'tutor'], ['translator', 'language'], ['pronunciation', 'mic'], ['profile', 'user'],
]);
function sectionButton(key, glyph, active) {
  const selected = key === canonicalSection(active);
  return `<a href="${studentSectionURL(key)}" class="sidebar-link ${selected ? 'is-active' : ''}" data-nav-section="${key}" ${selected ? 'aria-current="page"' : ''} title="${t(key)}">${icon(glyph)}<span>${t(key)}</span></a>`;
}
export function renderSidebar(container, collapsed, active = 'home', { sections = null,role='monitor' } = {}) {
  // Use the complete wordmark directly, not CSS-generated replacement content.
  const brandImage = `<img class="sidebar-wordmark" src="../assets/images/${collapsed ? 'Icono.png' : 'Logo%20Horizontal.png'}" alt="EDUNEXT" width="${collapsed ? 35 : 166}" height="${collapsed ? 35 : 56}">`;
  const updateBrand = () => {
    const link = container.querySelector('.sidebar-brand a');
    if (link) link.innerHTML = brandImage;
  };
  container.classList.toggle('monitor-navigation', Boolean(sections) && role === 'monitor');
  if (sections) {
   const groups={'Principal':'Main','Gestión educativa':'Education management','Seguimiento':'Follow-up','Organización':'Organization','Cuenta':'Account'};if(role==='monitor')sections=sections.map(group=>({...group,label:profileLocale()==='en'?groups[group.label]||group.label:group.label,items:group.items.map(([key,label,glyph])=>[key,uiT('m.nav.'+key)==='m.nav.'+key?label:uiT('m.nav.'+key),glyph])}));
  container.innerHTML = `<div class="sidebar-brand"><a href="../${config.routes.roles}"><img src="../assets/images/branding/mark.svg" alt="" width="38" height="38"><span>EDUNEXT</span></a><button class="sidebar-collapse" id="sidebar-toggle" type="button" aria-label="${collapsed?'Expandir':'Contraer'} navegación" aria-expanded="${!collapsed}">${icon('chevron')}</button></div><nav aria-label="Navegación docente">${sections.map(group=>`<h2 class="nav-group">${group.label}</h2>${group.items.map(([key,label,glyph])=>`<button type="button" class="sidebar-link ${key===active?'is-active':''}" data-section="${key}" title="${label}" ${key===active?'aria-current="page"':''}>${icon(glyph)}<span>${label}</span></button>`).join('')}`).join('')}</nav>`;
    const navigation = container.querySelector('nav');
    navigation.id = 'sidebar-navigation';
    container.querySelector('#sidebar-toggle').setAttribute('aria-controls', navigation.id);
     navigation.setAttribute('aria-label',role==='admin'?'Navegación administrativa':'Navegación docente');
     updateBrand();
   return;
 }
  const studentGroups = [
   ['navLearning', studentSections.slice(0,6)],
   ['navTracking', studentSections.slice(6,10)],
   ['navTools', studentSections.slice(10)],
  ];
  container.innerHTML = `<div class="sidebar-brand"><a href="../${config.routes.roles}" aria-label="EDUNEXT · ${t('backProfiles')}"><img src="../assets/images/branding/mark.svg" alt="" width="38" height="38"><span>EDUNEXT</span></a><button class="sidebar-collapse" type="button" id="sidebar-toggle" aria-label="${t(collapsed ? 'expand' : 'collapse')}" aria-expanded="${!collapsed}" aria-controls="sidebar-navigation">${icon('chevron')}</button></div><nav id="sidebar-navigation" aria-label="${t('navigation')}">${studentGroups.map(([label,items])=>`<h2 class="nav-group">${t(label)}</h2>${items.map(([key,glyph])=>sectionButton(key,glyph,active)).join('')}`).join('')}</nav><div class="sidebar-footer"><span>EDUNEXT<br><small>${t('demoShort')}</small></span></div>`;
  updateBrand();
}
export function renderMoreNavigation(active = 'home') {
 return `<nav class="more-navigation" aria-label="${t('navigation')}">${studentSections.map(([key, glyph]) => sectionButton(key, glyph, active)).join('')}</nav>`;
}
export function renderBottomNav(container, active = 'home') {
 container.innerHTML = [['home','home'],['courses','book'],['practice','practice'],['tutor','tutor'],['progress','chart']].map(([key,glyph]) => `<a href="${studentSectionURL(key)}" data-nav-section="${key}" ${key === canonicalSection(active) ? 'aria-current="page" class="is-active"' : ''}>${icon(glyph)}<span>${t(key === 'courses' ? 'learn' : key)}</span></a>`).join('');
 container.setAttribute('aria-label', t('navigation'));
}
