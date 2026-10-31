import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderConfirmModal({title, duration, count, attempts}={}){
 return `<div id="eval-confirm" class="modal" role="dialog" aria-modal="true">
  <div class="modal-content">
   <h2>¿Estás listo para comenzar?</h2>
   <ul class="modal-meta">
    <li>Evaluación: ${esc(title)}</li>
    <li>Duración: ${duration} min</li>
    <li>Total de preguntas: ${count}</li>
    <li>Intentos disponibles: ${attempts}</li>
   </ul>
   <p class="modal-warn">El temporizador comenzará al confirmar.</p>
   <div class="modal-actions">
    <button class="button-secondary" id="confirm-cancel">Cancelar</button>
    <button class="button-primary" id="confirm-start">Comenzar ahora</button>
   </div>
  </div>
 </div>`;
}
