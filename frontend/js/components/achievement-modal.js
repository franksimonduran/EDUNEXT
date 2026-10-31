import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderAchievementModal(a){
 return `<div id="ach-modal" class="modal">
  <div class="modal-content">
   <h2>¡Felicidades! Has desbloqueado un nuevo logro</h2>
   <h3>${esc(a.name)}</h3>
   <p>${esc(a.desc)}</p>
   <div class="modal-actions">
    <a class="button-primary" href="logros.html">Ver mis logros</a>
    <a class="button-secondary" href="aprende.html?grade=4">Continuar aprendiendo</a>
   </div>
  </div>
 </div>`;
}
