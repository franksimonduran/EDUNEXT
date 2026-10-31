import {escapeHTML as esc} from './student-ui.js';
import {activityIllustration} from './activity-illustration.js';
import {pt} from '../student/practice-i18n.js';
export function initialAnswer(question){return question.type==='ordering'?question.items.map(item=>item.id):question.type==='matching'?{}:question.type==='multi'?[]:'';}
export function renderQuestion(question,value,locked=false){
 let controls='';
 if(['multiple','boolean','image'].includes(question.type))controls=`<div class="answer-options ${question.type==='image'?'image-options':''}">${question.options.map(option=>`<label class="answer-option ${value===option.id?'is-selected':''}">${question.type==='image'&&!question.resource?activityIllustration(option.image,option.alt):''}<span><input type="radio" name="answer" value="${esc(option.id)}" ${value===option.id?'checked':''} ${locked?'disabled':''}><span lang="es">${esc(option.label)}</span></span></label>`).join('')}</div>`;
 if(['word','numeric'].includes(question.type))controls=`<label class="written-answer" for="written-answer">${pt('answer')}<input class="form-input" id="written-answer" name="answer" type="text" ${question.type==='numeric'?'inputmode="decimal"':''} value="${esc(value)}" maxlength="180" autocomplete="off" ${locked?'disabled':''} aria-describedby="answer-message"></label>`;
 if(question.type==='open')controls=`<label>Tu respuesta<textarea name="answer" maxlength="4000" ${locked?'disabled':''}>${esc(value||'')}</textarea></label>`;
 if(question.type==='multi')controls=`<p>Selecciona todas las opciones que correspondan.</p>${question.options.map(o=>`<label class="answer-option"><input type="checkbox" name="answer" value="${esc(o.id)}" ${Array.isArray(value)&&value.includes(o.id)?'checked':''} ${locked?'disabled':''}>${esc(o.label)}</label>`).join('')}`;
 if(question.type==='image'&&['../assets/images/branding/mark.svg','../assets/images/branding/open-book.svg'].includes(question.resource))controls=`<img class="question-resource" src="${esc(question.resource)}" alt="${esc(question.alt)}">`+controls;
 if(question.type==='matching')controls=`<div class="matching-rows">${question.pairs.map(pair=>`<label for="pair-${pair.id}"><span lang="es">${esc(pair.left)}</span><select id="pair-${pair.id}" data-pair="${esc(pair.id)}" ${locked?'disabled':''}><option value="">${pt('choose')}</option>${[...question.pairs].reverse().map(option=>`<option value="${esc(option.id)}" ${value?.[pair.id]===option.id?'selected':''}>${esc(option.right)}</option>`).join('')}</select></label>`).join('')}</div>`;
 if(question.type==='ordering')controls=`<ol class="ordering-list">${value.map((id,index)=>{const item=question.items.find(item=>item.id===id);return `<li><span class="order-position">${index+1}</span><span lang="es">${esc(item.label)}</span><div><button type="button" data-move="${esc(id)}" data-direction="-1" aria-label="${pt('up')}: ${esc(item.label)}" ${locked||index===0?'disabled':''}>↑</button><button type="button" data-move="${esc(id)}" data-direction="1" aria-label="${pt('down')}: ${esc(item.label)}" ${locked||index===value.length-1?'disabled':''}>↓</button></div></li>`;}).join('')}</ol>`;
 return `<p class="question-context" lang="es">${esc(question.context)}</p><fieldset class="question-fieldset" ${locked?'disabled':''}><legend lang="es">${esc(question.title)}</legend>${question.instructions?`<p>${esc(question.instructions)}</p>`:''}${controls}${question.type==='numeric'&&question.unit?`<p>Unidad: ${esc(question.unit)}</p>`:''}</fieldset>`;
}
export function mountQuestion(root,question,value,onChange){
 root.querySelectorAll('input,select,textarea').forEach(control=>control.addEventListener('input',()=>{
  if(question.type==='matching')value=Object.fromEntries([...root.querySelectorAll('[data-pair]')].map(select=>[select.dataset.pair,select.value]));
   else if(question.type==='multi')value=[...root.querySelectorAll('[name="answer"]:checked')].map(c=>c.value);
   else value=question.type==='multiple'||question.type==='boolean'||question.type==='image'?root.querySelector('[name="answer"]:checked')?.value??'':root.querySelector('[name="answer"]').value;
  onChange(value);
 }));
 root.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{
  const index=value.indexOf(button.dataset.move),target=index+Number(button.dataset.direction);
  if(target<0||target>=value.length)return;
  const next=[...value];[next[index],next[target]]=[next[target],next[index]];
  onChange(next,{repaint:true,focusId:button.dataset.move,direction:button.dataset.direction});
 }));
}
