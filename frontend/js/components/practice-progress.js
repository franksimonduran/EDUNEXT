import {progressBar} from './student-ui.js';
import {pt} from '../student/practice-i18n.js';
export function renderPracticeProgress(index,total){return `<div class="practice-progress"><span>${pt('question')} ${index+1} ${pt('of')} ${total}</span><strong>${Math.round(index/total*100)}%</strong>${progressBar(index/total*100,`${pt('question')} ${index+1} ${pt('of')} ${total}`)}</div>`;}
