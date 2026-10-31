import {icon} from './icons.js';
import {escapeHTML as esc} from './student-ui.js';
import {text} from '../student/i18n.js';
import {tt} from '../student/tutor-i18n.js';
export function renderTutorSuggestions(){
 return `<div class="tutor-suggestions">${[['explain','book'],['example','spark'],['guide','target'],['review','chart']].map(([intent,glyph])=>`<button type="button" data-tutor-intent="${intent}"><span class="suggestion-icon">${icon(glyph)}</span><span><strong>${tt(intent)}</strong><small>${tt(intent+'Desc')}</small></span></button>`).join('')}</div>`;
}
export function renderTutorExampleChoices(examples,action='explain'){
 return `<div class="tutor-example-choices">${examples.map(example=>`<button type="button" data-tutor-example="${esc(example.id)}" data-demo-action="${action}"><strong>${esc(text(example.subject))}</strong><span lang="es">${esc(example.title)}</span><small>${tt('knownPrompt')}: <span lang="es">${esc(example.prompt)}</span></small></button>`).join('')}</div>`;
}
