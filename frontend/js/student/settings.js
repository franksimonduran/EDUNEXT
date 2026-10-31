import { bootLearningPage } from './learning-page.js';
import { t, getLocale, setLocale } from '../i18n/i18n.js';
import { initTheme, applyTheme, getTheme } from '../utils/theme-manager.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = `${t('settings')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 initTheme();
 const locale = getLocale();
 const theme = getTheme();

 root.innerHTML = `<header><h1>${t('settings')}</h1><p>${t('settingsSub')}</p></header>
 <section class="settings-list">
  <article class="settings-card"><div><h3>${t('language')}</h3><p>Español / English</p></div><select id="lang"><option value="es" ${locale==='es'?'selected':''}>Español</option><option value="en" ${locale==='en'?'selected':''}>English</option></select></article>
  <article class="settings-card"><div><h3>${t('appearance')}</h3><p>Claro / Oscuro / Automático</p></div><select id="theme"><option value="light" ${theme==='light'?'selected':''}>Claro</option><option value="dark" ${theme==='dark'?'selected':''}>Oscuro</option><option value="auto" ${theme==='auto'?'selected':''}>Automático</option></select></article>
  <article class="settings-card"><div><h3>${t('learningPrefs')}</h3><p>Elige cómo te gusta estudiar</p></div><a class="button-secondary" href="preferencias.html">Personalizar</a></article>
  <article class="settings-card"><div><h3>${t('accessibility')}</h3><p>Adapta la plataforma</p></div><a class="button-secondary" href="accesibilidad.html">Configurar</a></article>
  <article class="settings-card"><div><h3>${t('privacy')}</h3><p>Información y seguridad</p></div><span>Ver</span></article>
 </section>`;
  root.querySelector('#lang').addEventListener('change',e=>{try{setLocale(e.target.value);location.reload();}catch{shell.openDialog('Error de almacenamiento','<p>No se pudo guardar el idioma.</p>');}});
  root.querySelector('#theme').addEventListener('change',e=>{try{applyTheme(e.target.value);}catch{shell.openDialog('Error de almacenamiento','<p>No se pudo guardar la apariencia.</p>');}});
 return ()=>{};
},{active:'profile'});
