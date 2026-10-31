import {bootLearningPage} from './learning-page.js';
import {learningURL} from './learning-routes.js';
import {loadTutorDemo,loadTutorMaterials} from '../data/tutor-demo.data.js';
import {getTutorDemoResponse} from '../services/tutor.service.js';
import {getTutorAvailability} from '../services/tutor-api.service.js';
import {config} from '../core/config.js';
import {validateTutorInput} from '../utils/tutor-validation.js';
import {renderTutorMessage} from '../components/tutor-message.js';
import {renderTutorInput,setupTutorInput} from '../components/tutor-input.js';
import {renderTutorSuggestions,renderTutorExampleChoices} from '../components/tutor-suggestions.js';
import {renderTutorContext} from '../components/tutor-context.js';
import {renderTutorConversations} from '../components/tutor-conversations.js';
import {renderTutorLearningActions} from '../components/tutor-learning-actions.js';
import {escapeHTML as esc} from '../components/student-ui.js';
import {icon} from '../components/icons.js';
import {tt} from './tutor-i18n.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {getAICapabilities,getTutorContexts,sendTutorMessage,aiOperationKey} from '../services/ai-api.service.js';
import {downloadOfflineStudyGuide} from '../services/offline-study.service.js';
import {mountLocalTutor} from './local-tutor.js';
import {mountTutorWorkspace} from './tutor-workspace.js';

const localMode=new URLSearchParams(location.search).get('modo')==='local';
const dualMode=new URLSearchParams(location.search).get('modo')!=='demo';
const live=!dualMode&&!localMode&&useProgressApi();
if(dualMode)window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

let controller;
export function updateTutorConnectivity(online=navigator.onLine){
 const notice=document.querySelector('#offline-notice');
 if(notice){notice.hidden=online;notice.textContent=`${tt('offlineNote')} ${tt('offlineLimit')}`;}
 const indicator=document.querySelector('#tutor-mode');
 if(indicator){
   if(live){indicator.textContent=!online?'Sin generación offline':controller?.available?'IA local configurada':'Servicio generativo no disponible';return;}
  const mode=!online?'offline':controller?.current()?.notice?'unavailable':'demonstration';
  indicator.dataset.mode=mode;indicator.textContent=tt(mode==='demonstration'?'demo':mode==='offline'?'offline':'unavailable');
 }
}

function createTutorController(model,route,shell){
 const root=document.querySelector('#learning-content');
 const state={conversations:[],active:null,nextConversation:1,nextMessage:1,conversationsOpen:matchMedia('(min-width:1101px)').matches,contextOpen:matchMedia('(min-width:1241px)').matches};
 // Consultar el contrato no confunde conectividad del navegador con IA conectada.
 const availability=getTutorAvailability();
  if(availability.connected&&!model.live)throw new Error('La demostración no admite un servicio conectado sin integración.');
 const current=()=>state.conversations.find(item=>item.id===state.active);
 const exampleById=id=>model.examples.find(item=>item.id===id);
 const nearBottom=log=>!log||log.scrollHeight-log.scrollTop-log.clientHeight<64;
 function createConversation(){
  if(state.conversations.length>=config.tutor.maxConversations)return;
  const number=state.nextConversation++;
   const conversation={id:`conversation-${number}`,number,exampleId:model.context?.id??null,context:model.context,messages:[],draft:'',notice:null,busy:false,version:0,scrollTop:null,unread:0,serverLessonId:model.contexts?.[0]?.lesson_id};
  state.conversations.push(conversation);state.active=conversation.id;
 }
 function renderConversationList(){
  root.querySelector('#tutor-conversation-list').innerHTML=renderTutorConversations(state.conversations,state.active,model.examples);
  root.querySelector('#new-tutor-conversation').disabled=state.conversations.length>=config.tutor.maxConversations;
  root.querySelector('#tutor-conversation-limit').hidden=state.conversations.length<config.tutor.maxConversations;
 }
  function renderContext(){
   const host=root.querySelector('#tutor-context-content');
   if(!model.live){host.innerHTML=renderTutorContext(current().context,model.grade,exampleById(current().exampleId));return;}
   host.innerHTML=`<label>Lección publicada autorizada<select id="live-tutor-lesson">${model.contexts.map(c=>`<option value="${esc(c.lesson_id)}" ${c.lesson_id===current().serverLessonId?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label><p>El grado se obtiene de los registros del servidor. Solo se utiliza un fragmento de esta lección.</p><p>No se conserva historial en servidor; las preguntas de esta vista no se envían como conversación completa.</p>`;
   host.querySelector('select').addEventListener('change',event=>{current().serverLessonId=event.target.value;});
  }
 function refreshBusy(){
  const conversation=current(),form=root.querySelector('#tutor-composer');
  if(!conversation||!form)return;
  form.setAttribute('aria-busy',String(conversation.busy));
   root.querySelector('#tutor-send').disabled=conversation.busy||(model.live&&(!model.available||!conversation.serverLessonId));
  root.querySelector('#tutor-request-status').textContent=conversation.busy?tt('processing'):'';
  root.querySelector('#tutor-log').setAttribute('aria-busy',String(conversation.busy));
 }
 function setupComposer(){
  const conversation=current();
  root.querySelector('#tutor-composer-host').innerHTML=renderTutorInput(conversation.draft,conversation.busy);
  setupTutorInput(root,{onDraft:value=>{current().draft=value;},onSubmit:value=>send(value)});
 }
 function refreshNewMessages(){const button=root.querySelector('#tutor-new-messages');button.hidden=current().unread===0;}
 function renderConversation(){
  const conversation=current(),log=root.querySelector('#tutor-log');
  log.setAttribute('aria-live','off');
  log.innerHTML=conversation.messages.length?conversation.messages.map(renderTutorMessage).join(''):`<div class="tutor-welcome"><span class="welcome-avatar" aria-hidden="true">${icon('tutor')}</span><h2>${tt('welcome')}</h2><p>${tt('welcomeQuestion')}</p>${renderTutorSuggestions()}<p class="welcome-note">${tt('demoNote')}</p></div>`;
  log.scrollTop=conversation.scrollTop??0;
  requestAnimationFrame(()=>{if(log.isConnected)log.setAttribute('aria-live','polite');});
   setupComposer();renderConversationList();renderContext();refreshBusy();refreshNewMessages();updateTutorConnectivity();
   if(model.live){const note=log.querySelector('.welcome-note');if(note)note.textContent=model.available?'Haz una pregunta sobre la lección seleccionada. No compartas datos personales.':'El servicio no está operativo. No se presentan respuestas de demostración como IA.';}
 }
 function appendMessage(conversation,message){
  const active=conversation===current(),log=root.querySelector('#tutor-log');
  const pinned=active&&(conversation.messages.length===0||nearBottom(log));
  conversation.messages.push(message);
  if(!active){renderConversationList();return;}
  log.querySelector('.tutor-welcome')?.remove();
  log.insertAdjacentHTML('beforeend',renderTutorMessage(message));
  if(pinned){log.scrollTop=log.scrollHeight;conversation.unread=0;}else conversation.unread++;
  conversation.scrollTop=log.scrollTop;refreshNewMessages();
 }
 async function send(value,{action,exampleId}={}){
  const conversation=current();
  if(!conversation||conversation.busy)return;
  const validation=validateTutorInput(value);
  const error=root.querySelector('#tutor-input-error'),input=root.querySelector('#tutor-question');
  if(!validation.valid){error.textContent=tt(validation.error);input.setAttribute('aria-invalid','true');input.focus();return;}
  if(conversation.messages.length+2>config.tutor.maxMessages){error.textContent=tt('messageLimit');return;}
  conversation.busy=true;const version=++conversation.version;
  if(action===undefined){conversation.draft='';input.value='';input.style.height='auto';root.querySelector('#tutor-character-count').textContent=`0 / ${config.tutor.maxInputLength}`;}
  error.textContent='';input.removeAttribute('aria-invalid');
  appendMessage(conversation,{id:`message-${state.nextMessage++}`,role:'user',text:validation.text});refreshBusy();
  try{
    let response;
    if(model.live){
     const signature=JSON.stringify([validation.text,conversation.serverLessonId]);
     if(conversation.pendingOperation?.signature!==signature)conversation.pendingOperation={signature,key:aiOperationKey()};
     const result=await sendTutorMessage({text:validation.text,lesson_id:conversation.serverLessonId,action:'explain'},conversation.pendingOperation.key);
     conversation.pendingOperation=null;
     response={mode:'generated',sources:result.sources,blocks:[{kind:'paragraph',text:result.text},{kind:'paragraph',text:result.warning}]};
    }else response=await getTutorDemoResponse({text:validation.text,action,exampleId,examples:model.examples});
   if(!state.conversations.includes(conversation)||version!==conversation.version)return;
   conversation.notice=response.mode==='unavailable'?'unavailable':null;
   if(response.exampleId)conversation.exampleId=response.exampleId;
   appendMessage(conversation,{id:`message-${state.nextMessage++}`,role:'assistant',response});
   }catch(error){
   if(!state.conversations.includes(conversation)||version!==conversation.version)return;
   conversation.notice='error';
    appendMessage(conversation,{id:`message-${state.nextMessage++}`,role:'assistant',response:{mode:'error',blocks:model.live?[{kind:'paragraph',text:`No se obtuvo una respuesta: ${error.message}`}]:[{kind:'error'}]}});
  }finally{
   if(version===conversation.version)conversation.busy=false;
   if(current()===conversation){refreshBusy();renderConversationList();renderContext();updateTutorConnectivity();}
  }
 }
 function chooseExample(action){
  shell.openDialog(tt('chooseExample'),`<p class="dialog-helper">${tt('source')}</p>${renderTutorExampleChoices(model.examples,action)}`);
 }
 function performAction(action,id){
  const conversation=current();if(!conversation||conversation.busy)return;
  const example=exampleById(id??conversation.exampleId);
  if(!example){chooseExample(action);return;}
  if(action==='practice'){location.assign(learningURL('exercise',{grade:model.grade,activity:`practice-${example.courseId}-${model.grade}`,lesson:example.lessonId}));return;}
  const requestAction=action==='returnTopic'?'explain':action;
  send(requestAction==='explain'?example.prompt:tt(action),{action:requestAction,exampleId:example.id});
 }
 function render(){
  document.title=`EDUNEXT AI | EDUNEXT`;
  root.innerHTML=`<header class="tutor-heading"><span class="tutor-heading-avatar" aria-hidden="true">${icon('tutor')}</span><div><span class="tutor-kicker">${tt('subtitle')}</span><h1>EDUNEXT AI</h1><p>${tt('description')}</p></div><span class="tutor-mode" id="tutor-mode" title="${tt('connectionHelp')}">${tt('demo')}</span></header><div class="tutor-layout"><aside class="tutor-conversation-panel"><details id="tutor-conversations" ${state.conversationsOpen?'open':''}><summary>${tt('conversations')}</summary><div class="conversation-panel-content"><button class="button-primary" type="button" id="new-tutor-conversation">+ ${tt('newConversation')}</button><p id="tutor-conversation-limit" class="tutor-panel-note" hidden>${tt('conversationLimit')}</p><div id="tutor-conversation-list"></div><button class="button-secondary" type="button" id="clear-tutor-conversation">${tt('clear')}</button><p class="tutor-panel-note">${tt('savedNowhere')}</p></div></details></aside><section class="tutor-chat" aria-label="${tt('chat')}"><header class="tutor-chat-toolbar"><span>${icon('tutor')} ${tt('assistant')}</span><button class="button-secondary" type="button" id="tutor-strategies">${tt('strategies')}</button></header><div id="tutor-log" class="tutor-log" role="log" tabindex="0" aria-label="${tt('chat')}" aria-live="polite" aria-relevant="additions" aria-atomic="false"></div><div class="tutor-new-messages-row"><button class="button-secondary" id="tutor-new-messages" type="button" hidden>${tt('newMessages')} ↓</button><p id="tutor-request-status" role="status"></p></div><div id="tutor-composer-host"></div></section><aside class="tutor-context-panel"><details id="tutor-context" ${state.contextOpen?'open':''}><summary>${tt('context')}</summary><div class="context-panel-content"><div id="tutor-context-content"></div><h2>${tt('examples')}</h2>${renderTutorExampleChoices(model.examples)}<p class="tutor-panel-note">${tt('source')}</p></div></details></aside></div><p class="tutor-disclaimer">${tt('demoNote')} ${tt('savedNowhere')}</p><p id="tutor-announcement" class="sr-only" role="status"></p>`;
  root.querySelector('#tutor-conversations').addEventListener('toggle',event=>{state.conversationsOpen=event.target.open;});
  root.querySelector('#tutor-context').addEventListener('toggle',event=>{state.contextOpen=event.target.open;});
  root.querySelector('#tutor-log').addEventListener('scroll',event=>{const conversation=current();conversation.scrollTop=event.target.scrollTop;if(nearBottom(event.target)){conversation.unread=0;refreshNewMessages();}});
    if(!model.live){
     const download=document.createElement('button');
     download.type='button';download.className='button-secondary';
     download.textContent='Descargar guía demo sin internet';
     download.addEventListener('click',()=>{
      try{downloadOfflineStudyGuide(model.grade,model.examples);root.querySelector('#tutor-announcement').textContent='Descarga solicitada. Guarda el archivo y ábrelo con un navegador compatible. Material demo, no IA generativa.';}
      catch{root.querySelector('#tutor-announcement').textContent='No se pudo preparar la guía. Inténtalo nuevamente.';}
     });
     root.querySelector('.tutor-heading').append(download);
     const localLink=document.createElement('a');localLink.className='button-secondary';localLink.href=`tutor.html?grade=${model.grade}&modo=local`;localLink.textContent='Probar MiniCPM en este equipo · Experimental';root.querySelector('.tutor-heading').append(localLink);
    }
    renderConversation();
   if(model.live){root.querySelector('#tutor-strategies').disabled=true;root.querySelectorAll('.tutor-panel-note,.tutor-disclaimer').forEach(node=>{node.textContent='Modo API. Conversación solo en memoria de esta vista; no hay historial persistido ni generación offline.';});}
 }
 root.addEventListener('click',event=>{
  if(event.target.closest('#new-tutor-conversation')){createConversation();renderConversation();root.querySelector('#tutor-question').focus();return;}
  const selected=event.target.closest('[data-tutor-conversation]');
  if(selected){const conversation=state.conversations.find(item=>item.id===selected.dataset.tutorConversation);if(conversation){state.active=conversation.id;renderConversation();root.querySelector(`[data-tutor-conversation="${conversation.id}"]`).focus();}return;}
  if(event.target.closest('#clear-tutor-conversation')){
   shell.openDialog(tt('clearTitle'),`<p>${tt('clearNote')}</p><div class="tutor-confirm-actions"><button type="button" class="button-secondary" data-cancel-tutor-clear>${tt('cancel')}</button><button type="button" class="button-primary" data-confirm-tutor-clear="${current().id}">${tt('confirm')}</button></div>`);return;
  }
  if(event.target.closest('#tutor-strategies')){shell.openDialog(tt('strategiesTitle'),`<p class="dialog-helper">${tt('notGenerated')}</p>${renderTutorLearningActions({exampleId:current().exampleId??''})}`);return;}
  if(event.target.closest('#tutor-new-messages')){const log=root.querySelector('#tutor-log');log.scrollTop=log.scrollHeight;current().unread=0;refreshNewMessages();}
  const intent=event.target.closest('[data-tutor-intent]');if(intent)performAction(intent.dataset.tutorIntent);
 });
 document.addEventListener('click',event=>{
  const cancel=event.target.closest('[data-cancel-tutor-clear]');if(cancel){document.querySelector('#dashboard-dialog').close();return;}
  const confirm=event.target.closest('[data-confirm-tutor-clear]');
  if(confirm){const conversation=state.conversations.find(item=>item.id===confirm.dataset.confirmTutorClear);if(conversation){conversation.version++;conversation.busy=false;conversation.messages=[];conversation.draft='';conversation.exampleId=conversation.context?.id??null;conversation.notice=null;conversation.scrollTop=null;conversation.unread=0;}document.querySelector('#dashboard-dialog').close();renderConversation();root.querySelector('#tutor-announcement').textContent=tt('cleared');root.querySelector('#tutor-question').focus();return;}
  const example=event.target.closest('[data-tutor-example]');
  if(example){const id=example.dataset.tutorExample;if(!exampleById(id))return;if(document.querySelector('#dashboard-dialog').open)document.querySelector('#dashboard-dialog').close();performAction(example.dataset.demoAction??'explain',id);return;}
  const action=event.target.closest('[data-tutor-action]');
  if(action){if(document.querySelector('#dashboard-dialog').open)document.querySelector('#dashboard-dialog').close();performAction(action.dataset.tutorAction,action.dataset.example||undefined);}
 });
 const conversationsMedia=matchMedia('(min-width:1101px)');conversationsMedia.addEventListener('change',event=>{state.conversationsOpen=event.matches;const details=root.querySelector('#tutor-conversations');if(details)details.open=event.matches;});
 const contextMedia=matchMedia('(min-width:1241px)');contextMedia.addEventListener('change',event=>{state.contextOpen=event.matches;const details=root.querySelector('#tutor-context');if(details)details.open=event.matches;});
 function setViewport(){root.style.setProperty('--tutor-viewport-height',`${window.visualViewport?.height??innerHeight}px`);}
 window.visualViewport?.addEventListener('resize',setViewport);setViewport();
 window.addEventListener('pagehide',()=>{state.conversations.forEach(conversation=>{conversation.version++;});state.conversations=[];state.active=null;root.replaceChildren();});
  window.addEventListener('pageshow',event=>{if(event.persisted){if(model.live){location.reload();return;}createConversation();render();}});
  createConversation();return {render,current,available:model.available};
}

bootLearningPage(async route=>{
 if(!live){const model=await loadTutorDemo(route.grade,route);if(dualMode)model.examples=await loadTutorMaterials(route.grade);return model;}
 try{
  const [caps,contexts]=await Promise.all([getAICapabilities(),getTutorContexts()]);
  return {live:true,grade:null,examples:[],context:null,contexts:contexts.items,available:caps.capabilities.find(c=>c.service==='tutor')?.state==='available'};
 }catch(error){return {error};}
},(model,route,shell)=>{
  if(dualMode)return mountTutorWorkspace(document.querySelector('#learning-content'),model);
 if(model.error){document.querySelector('#learning-content').innerHTML=`<section role="alert"><h1>Tutor no disponible</h1><p>${esc(model.error.message)}</p><p>No se utiliza una respuesta demo como respaldo.</p></section>`;return;}
 if(!controller)controller=createTutorController(model,route,shell);
 controller.render();
 },{active:'tutor',demoMessage:()=>dualMode?'Prueba interna · IA local y servicio online separados · No aprobado para alumnos reales.':tt('demoNote'),onConnectionChange:updateTutorConnectivity});
