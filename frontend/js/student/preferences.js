import { bootLearningPage } from './learning-page.js';
import { loadPrefs, savePrefs, resetPrefs } from '../data/preferences-defaults.data.js';
import { t } from '../i18n/i18n.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = `${t('learningPrefs')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 let p = loadPrefs();

 function render(){
  root.innerHTML = `<header><h1>${t('learningPrefs')}</h1><p>Elige las herramientas que te ayudan a aprender mejor</p></header>
  <section class="prof-card">
   <div class="pref-row"><span>Lectura</span><input type="checkbox" id="reading" ${p.reading?'checked':''}></div>
   <div class="pref-row"><span>Audio</span><input type="checkbox" id="audio" ${p.audio?'checked':''}></div>
   <div class="pref-row"><span>Imágenes</span><input type="checkbox" id="images" ${p.images?'checked':''}></div>
   <div class="pref-row"><span>Práctica</span><input type="checkbox" id="practice" ${p.practice?'checked':''}></div>
   <div class="pref-row"><span>Juegos</span><input type="checkbox" id="games" ${p.games?'checked':''}></div>
   <div style="display:flex;gap:.5rem;margin-top:1rem"><button class="button-primary" id="save">Guardar cambios</button><button class="button-secondary" id="reset">Restablecer</button><a class="button-secondary" href="configuracion.html">Volver</a></div>
   <p>${t('savedLocal')}</p>
  </section>`;
  ['reading','audio','images','practice','games'].forEach(k=>{ root.querySelector('#'+k).addEventListener('change',e=>{ p[k]=e.target.checked; }); });
  root.querySelector('#save').addEventListener('click',()=>{try{savePrefs(p);shell.openDialog('Guardado',`<p>${t('savedLocal')}</p>`);}catch{shell.openDialog('Error de almacenamiento','<p>No se pudieron guardar las preferencias en este dispositivo.</p>');}});
  root.querySelector('#reset').addEventListener('click',()=>{if(confirm('Restablecer preferencias?')){try{p=resetPrefs();render();}catch{shell.openDialog('Error de almacenamiento','<p>No se pudieron restablecer las preferencias.</p>');}}});
 }
 render();
 return ()=>{};
},{active:'profile'});
