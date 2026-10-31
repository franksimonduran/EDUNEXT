import { icon } from './icons.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderProgressBar(percent){
 return `<div class="prog-bar" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="prog-bar-fill" style="width:${percent}%"></div></div><div class="prog-bar-text">${percent}%</div>`;
}
