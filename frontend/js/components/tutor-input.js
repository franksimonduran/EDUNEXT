import {config} from '../core/config.js';
import {tt} from '../student/tutor-i18n.js';
import {icon} from './icons.js';
import {escapeHTML as esc} from './student-ui.js';
export function renderTutorInput(draft='',busy=false){
 return `<form class="tutor-composer" id="tutor-composer" novalidate aria-busy="${busy}"><label class="sr-only" for="tutor-question">${tt('input')}</label><div class="composer-row"><textarea id="tutor-question" name="question" rows="2" maxlength="${config.tutor.maxInputLength}" placeholder="${tt('placeholder')}" aria-describedby="composer-help tutor-input-error tutor-character-count">${esc(draft)}</textarea><button class="button-primary" type="submit" id="tutor-send" ${busy?'disabled':''} aria-label="${tt('send')}">${icon('arrow')}<span>${tt('send')}</span></button></div><div class="composer-meta"><span id="composer-help">${tt('shortcut')}</span><span id="tutor-character-count">${draft.length} / ${config.tutor.maxInputLength}</span></div><p class="tutor-input-error" id="tutor-input-error" role="status"></p><p class="composer-privacy">${tt('privacy')}</p></form>`;
}
export function setupTutorInput(root,{onSubmit,onDraft}){
 const form=root.querySelector('#tutor-composer'),input=root.querySelector('#tutor-question');
 const resize=()=>{input.style.height='auto';input.style.height=`${Math.min(input.scrollHeight,128)}px`;};
 input.addEventListener('input',()=>{onDraft(input.value);root.querySelector('#tutor-character-count').textContent=`${input.value.length} / ${config.tutor.maxInputLength}`;input.removeAttribute('aria-invalid');root.querySelector('#tutor-input-error').textContent='';resize();});
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
 form.addEventListener('submit',event=>{event.preventDefault();onSubmit(input.value);});
 resize();
}
