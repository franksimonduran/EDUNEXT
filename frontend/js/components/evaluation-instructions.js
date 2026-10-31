import { escapeHTML as esc } from './student-ui.js';

export function renderEvaluationInstructions(item){
 return `<section class="eval-instructions">
  <h3>Instrucciones</h3>
  <p>${esc(item.description)}</p>
  <ul>
   <li>Lee cuidadosamente cada pregunta antes de responder</li>
   <li>Puedes revisar tus respuestas antes de finalizar</li>
   <li>El temporizador comenzará al iniciar la evaluación</li>
  </ul>
 </section>`;
}
