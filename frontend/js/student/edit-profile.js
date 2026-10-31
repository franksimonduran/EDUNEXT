import { bootLearningPage } from './learning-page.js';
import { getProfile, saveProfileLocal } from '../data/profile-demo.data.js';
import { renderAvatarSelector } from '../components/avatar-selector.js';
import { t } from '../i18n/i18n.js';
import {escapeHTML as esc} from '../components/student-ui.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Editar Perfil | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const profile = getProfile();
 let selected = profile.avatar;

 function render(){
  root.innerHTML = `<header><h1>Personaliza tu perfil</h1><p>Elige cómo quieres aparecer en EDUNEXT</p></header>
  <section class="prof-card">
   <label>Alias educativo <input id="alias" maxlength="40" value="${esc(profile.alias)}"></label>
   <h3>Avatar</h3>
   <div id="avatar-wrap">${renderAvatarSelector(selected)}</div>
   <div style="display:flex;gap:.5rem"><button class="button-primary" id="save">Guardar</button><a class="button-secondary" href="perfil.html">Cancelar</a></div>
   <p>${t('savedLocal')}</p>
  </section>`;
  root.querySelectorAll('.avatar-opt').forEach(b=>b.addEventListener('click',()=>{profile.alias=root.querySelector('#alias').value;selected=b.dataset.av;render();}));
  root.querySelector('#save').addEventListener('click',()=>{
   const alias = root.querySelector('#alias').value.trim();
   if(alias){try{saveProfileLocal({alias,avatar:selected});location.assign('perfil.html');}catch{shell.openDialog('No se pudo guardar','<p>Revisa el alias (2–40 caracteres de texto seguro) y el almacenamiento del navegador.</p>');}}
  });
 }
 render();
 return ()=>{};
},{active:'profile'});
