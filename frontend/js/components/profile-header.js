import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderProfileHeader(profile){
 return `<header class="prof-header">
  <div class="prof-hero">
   <div class="prof-avatar-large"><span>${icon('user')}</span></div>
   <div class="prof-info">
    <h1>${esc(profile.alias)}</h1>
    <p>Grado: ${profile.grade}° primaria · ${esc(profile.role)}</p>
    <p>${esc(profile.institution)} · ${esc(profile.aula)}</p>
    <a class="button-primary" href="editar-perfil.html">Editar perfil</a>
   </div>
  </div>
 </header>`;
}
