import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { getPronunciationItem } from '../data/pronunciation-demo.data.js';
import { validatePronunciationTarget } from '../utils/pronunciation-validation.js';
import { renderPracticeSteps } from '../components/practice-steps.js';
import { renderMicrophoneControl, renderAudioPlayer } from '../components/microphone-control.js';
import { renderVoiceVisualizer } from '../components/voice-visualizer.js';
import { renderPronunciationFeedback } from '../components/pronunciation-feedback.js';
import { requestMicrophone, stopStream, isMicrophoneSupported } from '../services/microphone.service.js';
import { recordingService } from '../services/recording.service.js';
import { isSpeechSupported, speak, stop } from '../services/speech.service.js';
import { languageTag } from '../utils/language-format.js';
import { ps } from './pronunciation-i18n.js';
import { icon } from '../components/icons.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {getPronunciationReference} from '../services/ai-api.service.js';
import {renderReferencePractice} from './pronunciation-api-practice.js';
import {escapeHTML as esc} from '../components/student-ui.js';

const live=useProgressApi();

bootLearningPage(async route => {
 if(!live)return {route,grade:route.grade};
 try{return {route,entry:await getPronunciationReference(route.id||route.wordId||'')};}catch(error){return {route,error};}
}, ({ route,entry,error }, _route, shell) => {
 document.title = `Practicar | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 if(error){root.innerHTML=`<section role="alert"><h1>Práctica no disponible</h1><p>${esc(error.message)}</p></section>`;return ()=>{};}
 if(live)return renderReferencePractice(root,entry);
 const grade = route.grade ? Number(route.grade) : 4;
 const id = route.id || route.wordId || null;
 const item = id ? getPronunciationItem(id) : null;

 if (!item) {
  root.innerHTML = `<section class="pron-section"><h1>Elemento no encontrado</h1><p>Selecciona una palabra desde la lista de pronunciación.</p><a class="button-primary" href="${learningURL('pronunciation',{grade})}">Volver a Pronuncia</a></section>`;
  return () => {};
 }

 const valid = validatePronunciationTarget({ word: item.word, lang: item.lang });
 if (!valid.valid) {
  root.innerHTML = `<section class="pron-section"><h1>Error</h1><p>Objetivo de práctica no válido.</p><a class="button-secondary" href="${learningURL('pronunciation',{grade})}">Volver</a></section>`;
  return () => {};
 }

 let stream = null;
 let recording = false;
 let audioUrl = null;

 root.innerHTML = `<header class="pron-header">
  <div class="pron-title">
   <span class="pron-avatar" aria-hidden="true">${icon('mic')}</span>
   <div class="pron-heading">
    <span class="kicker">EDUNEXT PRONUNCIA</span>
    <h1>Practicar: ${item.word}</h1>
    <p>${item.translation} · ${item.lang.toUpperCase()}</p>
   </div>
  </div>
  <div class="pron-header-actions">
   <a class="button-secondary" href="${learningURL('pronunciation',{grade})}">${ps('back')}</a>
  </div>
 </header>
 ${renderPracticeSteps({ current: 2 })}
 <section class="pron-practice">
  <article class="pron-model">
   <h2>${ps('modelWord')}</h2>
   <p class="pron-model-word">${item.word}</p>
   <p class="pron-model-ex">${item.example || ''}</p>
   <div class="pron-model-actions">
    <button class="button-secondary" id="listen-model">${icon('speaker')}<span>${ps('listenTarget')}</span></button>
    <button class="button-secondary" id="listen-slow">${icon('speaker')}<span>${ps('listenSlow')}</span></button>
   </div>
   <p class="pron-privacy">${ps('privacyNote')}</p>
  </article>
  <article class="pron-attempt">
   <h2>${ps('yourTry')}</h2>
   <div class="pron-mic-row">
    ${renderMicrophoneControl({ supported: isMicrophoneSupported() && (typeof MediaRecorder !== 'undefined') })}
    ${renderVoiceVisualizer()}
   </div>
   <div id="mic-feedback"></div>
   <div id="audio-wrap">
    ${renderAudioPlayer({ url: audioUrl })}
   </div>
   <div class="pron-attempt-actions">
    <button class="button-secondary" id="delete-rec" disabled>${ps('deleteRecording')}</button>
    <button class="button-primary" id="save-attempt" disabled>${ps('saveAttempt')}</button>
   </div>
  </article>
 </section>`;

 const micBtn = root.querySelector('[data-mic-toggle]');
 const micFb = root.querySelector('#mic-feedback');
 const audioWrap = root.querySelector('#audio-wrap');
 const delBtn = root.querySelector('#delete-rec');
 const saveBtn = root.querySelector('#save-attempt');
 const listenModel = root.querySelector('#listen-model');
 const listenSlow = root.querySelector('#listen-slow');

 micBtn.addEventListener('click', async () => {
  if (recording) {
   recordingService.stop();
   const blob = recordingService.getBlob();
   if (blob) {
    audioUrl = recordingService.getURL();
    audioWrap.innerHTML = renderAudioPlayer({ url: audioUrl });
    const audio = audioWrap.querySelector('audio');
    audio?.removeAttribute('hidden');
    delBtn.disabled = false;
    saveBtn.disabled = false;
    micFb.innerHTML = '';
   } else {
    micFb.innerHTML = renderPronunciationFeedback({ text: ps('noRecording') });
   }
   recording = false;
   micBtn.outerHTML = renderMicrophoneControl({ supported: isMicrophoneSupported() && (typeof MediaRecorder !== 'undefined'), recording: false });
   root.querySelector('[data-mic-toggle]').addEventListener('click', micBtn._handler || (()=>{}));
   return;
  }

  if (!isMicrophoneSupported() || typeof MediaRecorder === 'undefined') {
   micFb.innerHTML = renderPronunciationFeedback({ mode: 'error', text: ps('unsupported') });
   return;
  }
  try {
   if (stream) { stopStream(stream); stream = null; }
   stream = await requestMicrophone({ audio: true });
   recordingService.start(stream);
   recording = true;
   micFb.innerHTML = renderPronunciationFeedback({ text: ps('recording') });
   micBtn.outerHTML = renderMicrophoneControl({ supported: true, recording: true });
   root.querySelector('[data-mic-toggle]').addEventListener('click', micToggle);
  } catch (e) {
   if (e?.name === 'NotAllowedError') micFb.innerHTML = renderPronunciationFeedback({ mode: 'error', text: ps('micDenied') });
   else micFb.innerHTML = renderPronunciationFeedback({ mode: 'error', text: ps('noMic') });
  }
 });

 const micToggle = async () => {
  // handled above by re-binding; easier: just reload logic
 };

 delBtn.addEventListener('click', () => {
  recordingService.clear();
  audioUrl = null;
  audioWrap.innerHTML = renderAudioPlayer({ url: null });
  delBtn.disabled = true;
  saveBtn.disabled = true;
 });

 saveBtn.addEventListener('click', () => {
  const blob = recordingService.getBlob();
  const url = recordingService.getURL();
  const { addPronunciationAttempt } = awaitImport();
  // use dynamic import pattern
 });

 async function awaitImport(){ const m = await import('../services/pronunciation.service.js'); return m; }

 listenModel.addEventListener('click', () => {
  if (!isSpeechSupported()) { shell.openDialog('Info', `<p>${ps('unsupported')}</p>`); return; }
  speak(item.word, languageTag(item.lang), { slow: false });
 });
 listenSlow.addEventListener('click', () => {
  if (!isSpeechSupported()) { shell.openDialog('Info', `<p>${ps('unsupported')}</p>`); return; }
  speak(item.word, languageTag(item.lang), { slow: true });
 });

 saveBtn.onclick = async () => {
  const { addPronunciationAttempt } = await import('../services/pronunciation.service.js');
  addPronunciationAttempt({ itemId: item.id, word: item.word, lang: item.lang, grade, hasRecording: !!audioUrl });
  shell.openDialog('Guardado', `<p>${ps('attemptSaved')}</p><p><a class="button-primary" href="${learningURL('pronunciation-result',{grade,id:item.id})}">Ver resultado</a> <a class="button-secondary" href="${learningURL('pronunciation-history',{grade})}">${ps('history')}</a></p>`);
 };

 return () => { stop(); stopStream(stream); recordingService.destroy(); };
},{active:'pronunciation',demoMessage:()=>ps('privacyNote')});
