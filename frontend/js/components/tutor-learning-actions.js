import {icon} from './icons.js';
import {escapeHTML as esc} from './student-ui.js';
import {tt} from '../student/tutor-i18n.js';
const actions=[['easy','book'],['steps','chart'],['another','spark'],['drawing','globe'],['hint','target'],['practice','practice']];
export function renderTutorLearningActions({attribute='data-tutor-action',includeTutor=false,exampleId=''}={}){
 const attr=attribute==='data-help'?'data-help':'data-tutor-action';
 return `<div class="help-options tutor-strategy-options">${[...actions,...(includeTutor?[['tutor','tutor']]:[])].map(([key,glyph])=>`<button type="button" class="button-secondary" ${attr}="${key}" ${exampleId?`data-example="${esc(exampleId)}"`:''}>${icon(glyph)}<span>${tt(key==='tutor'?'openTutor':key)}</span></button>`).join('')}</div>`;
}
export function renderTutorQuickActions(exampleId){
 return `<div class="tutor-quick-actions" aria-label="${tt('strategiesTitle')}">${['easy','steps','another','hint','practice','returnTopic'].map(key=>`<button type="button" data-tutor-action="${key}" data-example="${esc(exampleId)}">${tt(key)}</button>`).join('')}</div>`;
}
