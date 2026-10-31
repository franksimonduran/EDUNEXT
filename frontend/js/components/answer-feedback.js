import {escapeHTML as esc} from './student-ui.js';
import {pt} from '../student/practice-i18n.js';
export function renderAnswerFeedback(correct,explanation){return `<div class="answer-feedback ${correct?'is-correct':'is-incorrect'}"><strong>${pt(correct?'correct':'incorrect')}</strong><p lang="es">${esc(explanation)}</p></div>`;}
