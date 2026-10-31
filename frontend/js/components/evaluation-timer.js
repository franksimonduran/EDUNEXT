import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';
import { formatTime } from '../utils/evaluation-time.js';

export function renderEvaluationTimer(seconds, warn5, warn1){
 let cls = 'eval-timer';
 if(warn1) cls += ' eval-timer--danger';
 else if(warn5) cls += ' eval-timer--warn';
 return `<div class="${cls}" role="timer" aria-live="polite"><span class="timer-icon">${icon('clock')}</span><span>Tiempo restante: ${formatTime(seconds)}</span></div>`;
}
