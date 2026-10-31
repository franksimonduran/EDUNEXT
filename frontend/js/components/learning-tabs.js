import { lt } from '../student/learning-i18n.js';
export function renderLearningTabs() {
 return `<div class="learning-tabs" role="tablist" aria-label="${lt('modes')}">${['read','listen','view','practice'].map((mode,index)=>`<button type="button" role="tab" id="tab-${mode}" aria-selected="${index===0}" aria-controls="panel-${mode}" tabindex="${index===0?0:-1}">${lt(mode)}</button>`).join('')}</div>`;
}
export function setupLearningTabs(root,onChange=()=>{}) {
 const tabs=[...root.querySelectorAll('[role="tab"]')];
 function activate(tab,focus=true) {
  tabs.forEach(item=>{
   const active=item===tab;
   item.setAttribute('aria-selected',String(active)); item.tabIndex=active?0:-1;
   root.querySelector(`#${item.getAttribute('aria-controls')}`).hidden=!active;
  });
  if(focus) tab.focus();
  onChange(tab.id.replace('tab-',''));
 }
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activate(tab));
  tab.addEventListener('keydown',event=>{
   let next;
   if(event.key==='ArrowRight') next=(index+1)%tabs.length;
   if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
   if(event.key==='Home') next=0;
   if(event.key==='End') next=tabs.length-1;
   if(next!==undefined) {event.preventDefault();activate(tabs[next]);}
  });
 });
 return activate;
}
