import { escapeHTML as esc } from './student-ui.js';

export function renderPracticeSteps({ current = 1 } = {}) {
 const steps = ['Escuchar', 'Prepararse', 'Grabar', 'Revisar'];
 return `<ol class="practice-steps">
  ${steps.map((s,i)=>{ const n=i+1; const state = n===current?'current':n<current?'done':'upcoming'; return `<li class="practice-step practice-step--${state}"><span class="practice-step-num">${n}</span><span>${esc(s)}</span></li>`; }).join('')}
 </ol>`;
}
