import {escapeHTML as esc} from './student-ui.js';
import {icon} from './icons.js';
import {tt} from '../student/tutor-i18n.js';
import {tutorText,formatTutorBlock} from '../utils/tutor-format.js';
import {renderTutorQuickActions} from './tutor-learning-actions.js';
export function renderTutorMessage(message){
 if(message.role==='user')return `<article class="tutor-message tutor-message-user" data-message-id="${message.id}"><div class="message-author">${tt('user')}</div><div class="tutor-bubble">${tutorText(message.text)}</div></article>`;
 if(message.response.mode==='generated')return `<article class="tutor-message tutor-message-assistant"><div class="assistant-message-content"><div class="message-author">EDUNEXT AI · IA generada, sin revisión docente</div><div class="tutor-bubble">${message.response.blocks.map(formatTutorBlock).join('')}</div><p>Contexto consultado: ${(message.response.sources||[]).map(source=>`${esc(source.title)} · versión ${esc(source.version_id)}`).join('; ')||'Sin fuentes'}</p></div></article>`;
 return `<article class="tutor-message tutor-message-assistant" data-message-id="${message.id}"><span class="tutor-avatar" aria-hidden="true">${icon('tutor')}</span><div class="assistant-message-content"><div class="message-author">${tt('assistant')} <span class="response-tag">${tt(message.response.mode==='demonstration'?'predefined':message.response.mode==='error'?'error':'unavailable')}</span></div><div class="tutor-bubble">${message.response.blocks.map(formatTutorBlock).join('')}</div>${message.response.exampleId?renderTutorQuickActions(message.response.exampleId):''}</div></article>`;
}
