import {t} from '../i18n/i18n.js';
import {escapeHTML as esc} from './student-ui.js';
export function showDemoExit(open){open(t('m.leaveTitle'),`<p>${esc(t('m.leaveText'))}</p><div class="actions"><button type="button" id="confirm-demo-exit">${esc(t('m.confirm'))}</button></div>`);document.querySelector('#confirm-demo-exit').onclick=()=>location.assign('../demo.html');}
export function installAccountNavigation(open){
 document.addEventListener('click',e=>{const button=e.target.closest('button'),key=button?.dataset.section;
  if(key==='profile'||key==='settings'){e.preventDefault();e.stopImmediatePropagation();location.assign(key==='profile'?'perfil.html':'configuracion.html');}
  if(key==='logout'||button?.dataset.accountLogout!==undefined){e.preventDefault();e.stopImmediatePropagation();showDemoExit(open);}
  if(button?.dataset.open==='user'){e.preventDefault();e.stopImmediatePropagation();open(t('m.profile'),`<nav class="account-menu" aria-label="${esc(t('m.settings'))}"><a href="perfil.html">${esc(t('m.profile'))}</a><a href="configuracion.html">${esc(t('m.settings'))}</a><a href="ayuda.html">${esc(t('m.help'))}</a><button type="button" data-account-logout>${esc(t('m.logout'))}</button></nav>`);}
 },true);
}
