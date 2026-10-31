import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { t, text, getLocale } from './i18n.js';
import { ts } from './translator-i18n.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc } from '../components/student-ui.js';
import { renderSourcePanel, renderTargetPanel, renderSwapButton, renderOutputPlaceholder } from '../components/translation-panel.js';
import { renderTranslationResult, renderResultNotice } from '../components/translation-result.js';
import { renderAudioControls, setAudioState } from '../components/audio-controls.js';
import { translateText } from '../services/translation.service.js';
import { getTranslationAvailability } from '../services/translation-api.service.js';
import { validateTranslationInput } from '../utils/translation-validation.js';
import { listWords, toggleWord, hasWord } from '../services/vocabulary.service.js';
import { speak, stop, isSpeechSupported } from '../services/speech.service.js';
import { languageTag } from '../utils/language-format.js';
import { config } from '../core/config.js';
import { dictionaryEntries } from '../data/dictionary-demo.data.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {getAICapabilities,translateWithAI,findDictionaryEntries,aiOperationKey} from '../services/ai-api.service.js';
import {onAuthenticationCleared} from '../services/auth.service.js';

const live=useProgressApi();

const availability = getTranslationAvailability();
if (availability.connected) throw new Error('La demostración no admite un servicio conectado sin integración.');

let speechTarget = null, speechRate = null;

bootLearningPage(async route => {
 if(!live)return {route,grade:route.grade};
 try{return {route,capabilities:await getAICapabilities()};}catch(error){return {route,error};}
}, ({ route,capabilities,error }, _route, shell) => {
 document.title = `${ts('title')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
  if(error){root.innerHTML=`<section role="alert"><h1>Servicios de idioma no disponibles</h1><p>${esc(error.message)}</p><p>Necesitas una sesión y un backend configurado. No se sustituyen por resultados demo.</p><a href="../login.html">Iniciar sesión</a></section>`;return ()=>{};}
 const saved = listWords();
 const from = ['es','en','pt','fr','de','it','zh','ja','ko','ar'].includes(route.from) ? route.from : 'es';
 const to = ['es','en','pt','fr','de','it','zh','ja','ko','ar'].includes(route.to) ? route.to : 'en';

 root.innerHTML = `<header class="translator-header"><div class="translator-title"><span class="translator-avatar" aria-hidden="true">${icon('language')}</span><div class="translator-heading"><span class="kicker">${ts('title')}</span><h1>EDUNEXT Translate</h1><p>${ts('description')}</p></div></div><div class="translator-header-actions"><span class="translator-mode">${ts('demo')}</span><a class="button-secondary" href="${learningURL('vocabulary',{grade:route.grade})}">${ts('vocabTitle')}</a></div></header><section class="translator-panels" aria-label="${ts('title')}"><div id="source-host"></div><div class="swap-wrap">${renderSwapButton()}</div><div id="target-host"></div></section><div class="translator-actions"><button class="button-primary" id="do-translate">${icon('spark')}<span>${ts('translate')}</span></button></div><section class="translator-suggestions"><div><h2>${ts('suggestions')}</h2><p>${ts('suggestionNote')}</p></div><div class="suggestion-list">${dictionaryEntries.filter(e=>e.from===from&&e.to===to).slice(0,10).map(e=>`<button type="button" class="suggestion-chip" data-suggest="${esc(e.word)}">${esc(e.word)}</button>`).join('')}</div></section><p class="tutor-disclaimer">${ts('demoNote')}</p>`;

 root.querySelector('#source-host').innerHTML = renderSourcePanel({ from, text: route.word ?? '' });
 root.querySelector('#target-host').innerHTML = renderTargetPanel({ to });
 const output = root.querySelector('#translation-output');
 output.innerHTML = renderOutputPlaceholder();

 const textarea = root.querySelector('#source-input');
 const counter = root.querySelector('#source-status');
 const pasteBtn = root.querySelector('#paste-source');
  const updateCounter = () => { counter.textContent = ts('characters', { count: textarea.value.length, max: config.translator.maxInputLength }); };
  updateCounter(); textarea.addEventListener('input', updateCounter);
  let translationOperation=null,viewActive=true,translationBusy=false,requestVersion=0;
  const invalidate=()=>{requestVersion++;};
  textarea.addEventListener('input',invalidate);
  root.querySelectorAll('#source-language,#target-language').forEach(select=>select.addEventListener('change',invalidate));
  const unsubscribe=live?onAuthenticationCleared(()=>{viewActive=false;invalidate();textarea.value='';output.replaceChildren();root.querySelector('#do-translate').disabled=true;}):()=>{};
  if(!live){
   const apiLink=document.createElement('a');apiLink.className='button-secondary';
   apiLink.href=`traductor.html?modo=api&grade=${route.grade}&lang=${getLocale()}`;
   apiLink.textContent='Usar traductor del servidor · Requiere sesión';
   root.querySelector('.translator-header-actions').append(apiLink);
  }
  if(live){
   root.querySelector('.translator-mode').textContent='Traducción automática · Modelo local del servidor';
   root.querySelector('.tutor-disclaimer').textContent='Inglés ↔ español: palabras y frases. No compartas datos personales. El modelo puede equivocarse. Necesitas conexión con el servidor; si está en el colegio, puede funcionar por wifi local sin internet. No ejecuta un modelo dentro del celular.';
  root.querySelector('.translator-suggestions').hidden=true;
  root.querySelector('.translator-header-actions a').hidden=true;
  root.querySelectorAll('#source-language option,#target-language option').forEach(option=>{if(!['es','en'].includes(option.value))option.remove();});
  root.querySelector('#detect-language').disabled=true;
  const translation=capabilities.capabilities.find(c=>c.service==='translation');
  root.querySelector('#do-translate').disabled=translation?.state!=='available';
   if(translation?.state!=='available')output.innerHTML='<p role="status">Traducción automática no disponible: requiere modelos instalados, habilitación del operador y aprobación institucional. Puedes consultar vocabulario local autorizado.</p>';
  const button=document.createElement('button');button.type='button';button.className='button-secondary';button.textContent='Buscar en diccionario local';root.querySelector('.translator-actions').append(button);
   button.addEventListener('click',async()=>{
    if(!viewActive||translationBusy)return;
    const version=++requestVersion;
   button.disabled=true;output.textContent='Consultando vocabulario local…';
   try{
     const found=await findDictionaryEntries(textarea.value.trim(),root.querySelector('#source-language').value);
      if(!viewActive||version!==requestVersion)return;
    output.innerHTML=found.items.length?found.items.map(entry=>`<article class="result-word-card"><h2>${esc(entry.word)} — ${esc(entry.translation)}</h2><p>${esc(entry.category)}</p><p>${esc(entry.example)} — ${esc(entry.exampleTranslation)}</p><p>Origen: vocabulario local del proyecto; no generado por IA. ${esc(entry.license_status)}</p></article>`).join(''):'<p>Sin entrada disponible. No se inventa una traducción.</p>';
    }catch(error){if(viewActive&&version===requestVersion)output.textContent=`Consulta no disponible: ${error.message}`;}finally{button.disabled=!viewActive;}
  });
 }
 textarea.setAttribute('aria-describedby', 'source-status');

  if (navigator.clipboard?.readText) { pasteBtn.hidden = false; pasteBtn.addEventListener('click', async () => { try { const text = await navigator.clipboard.readText(); invalidate();textarea.value = text.slice(0, config.translator.maxInputLength); updateCounter(); counter.textContent = ts('pasted'); } catch { counter.textContent = ts('pasteUnavailable'); } }); }

  root.querySelector('#clear-source').addEventListener('click', () => { invalidate();textarea.value = ''; updateCounter(); output.innerHTML = renderOutputPlaceholder(); textarea.focus(); });

 root.querySelector('#detect-language').addEventListener('click', () => { counter.textContent = ts('detectingNote'); });

  root.querySelector('#swap-languages').addEventListener('click', () => {
   invalidate();
  const s = root.querySelector('#source-language').value, tsel = root.querySelector('#target-language').value;
  if (['es','en','pt','fr','de','it','zh','ja','ko','ar'].includes(tsel)) root.querySelector('#source-language').value = tsel;
  if (['es','en','pt','fr','de','it','zh','ja','ko','ar'].includes(s)) root.querySelector('#target-language').value = s;
  updateCounter();
 });

 root.querySelectorAll('[data-suggest]').forEach(btn => btn.addEventListener('click', () => { textarea.value = btn.dataset.suggest; updateCounter(); doTranslate(); }));

 root.querySelector('#do-translate').addEventListener('click', doTranslate);
 textarea.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doTranslate(); } });

   async function doTranslate() {
   if(live&&(!viewActive||translationBusy))return;
  stop(); updateSpeechState();
  const fromSel = root.querySelector('#source-language').value, toSel = root.querySelector('#target-language').value;
  const validation = validateTranslationInput(textarea.value, fromSel, toSel);
   if (!validation.valid) {
   output.innerHTML = renderResultNotice(validation.error === 'tooLong' ? 'tooLong' : validation.error, { max: config.translator.maxInputLength });
   counter.textContent = ts(validation.error === 'tooLong' ? 'tooLong' : validation.error === 'empty' ? 'empty' : validation.error === 'sameLanguage' ? 'sameLanguage' : 'empty');
    return;
   }
   if(live){
     if(capabilities.capabilities.find(c=>c.service==='translation')?.state!=='available'){output.textContent='Traducción automática no disponible. No se envió una solicitud al modelo.';return;}
     translationBusy=true;const version=++requestVersion;
    const button=root.querySelector('#do-translate');button.disabled=true;output.textContent='Consultando modelo local…';
    const signature=JSON.stringify([validation.text,fromSel,toSel]);
    if(translationOperation?.signature!==signature)translationOperation={signature,key:aiOperationKey()};
    try{
     const result=await translateWithAI({text:validation.text,source_language:fromSel,target_language:toSel},translationOperation.key);
      if(!viewActive||version!==requestVersion)return;
     output.innerHTML=`<article class="result-word-card"><h2>Traducción generada, sin revisión docente</h2><p>${esc(result.text)}</p><p>${esc(result.warning)}</p></article>`;
     translationOperation=null;
     }catch(error){if(viewActive&&version===requestVersion)output.textContent=`No se obtuvo una traducción: ${error.message}`;}
     finally{translationBusy=false;button.disabled=!viewActive||capabilities.capabilities.find(c=>c.service==='translation')?.state!=='available';}
    return;
   }
  const result = translateText({ text: validation.text, from: fromSel, to: toSel });
  if (result.status === 'found') {
   const entry = result.entry;
   const savedNow = hasWord(entry.id);
   output.innerHTML = renderTranslationResult({ entry, from: fromSel, to: toSel, saved: savedNow });
   setupResult(entry, fromSel, toSel, savedNow);
   counter.textContent = ts('found');
  } else if (result.status === 'pairUnavailable') {
   output.innerHTML = renderResultNotice('pairUnavailable');
   counter.textContent = ts('pairUnavailable');
  } else if (result.status === 'notFound') {
   output.innerHTML = renderResultNotice('notFound', { text: result.text });
   counter.textContent = ts('notFound', { text: result.text });
  } else {
   output.innerHTML = renderResultNotice('invalid');
   counter.textContent = ts('invalid');
  }
 }

 function setupResult(entry, fromSel, toSel, savedNow) {
  const card = output.querySelector('.result-word-card');
  const saveBtn = output.querySelector('[data-save-word]');
  const saveLabel = output.querySelector('[data-save-label]');
  saveBtn?.addEventListener('click', () => {
   const res = toggleWord(entry);
   saveBtn.setAttribute('aria-pressed', String(res.saved));
   saveLabel.textContent = res.saved ? ts('remove') : ts('save');
   counter.textContent = res.saved ? ts('saved') : ts('removed');
  });
  output.querySelector('[data-detail-word]')?.addEventListener('click', e => {
   e.preventDefault();
   const u = new URL(learningURL('word',{grade:route.grade,word:entry.word,from:entry.from,to:entry.to}));
   location.assign(u.pathname.split('/').pop() + '?' + u.searchParams.toString());
  });
   output.querySelector('[data-pronounce]')?.addEventListener('click', () => {
    const grade = route.grade || '4';
    // try to find a matching pronunciation item by word
    try {
      import('../data/pronunciation-demo.data.js').then(m => {
        const found = m.getPronunciationByWord ? m.getPronunciationByWord(entry.word, entry.to === 'es' ? 'es' : entry.to === 'en' ? 'en' : entry.to) : null;
        if (found) {
          location.assign(`${location.pathname.replace(/traductor\.html.*/, '')}practicar-pronunciacion.html?grade=${grade}&id=${found.id}`);
          return;
        }
        // fallback to pronunciation list
        location.assign(`${location.pathname.replace(/traductor\.html.*/, '')}pronuncia.html?grade=${grade}`);
      }).catch(() => {
        shell.openDialog(ts('tryPronounce'), `<p class="dialog-helper">${ts('demo')}</p><p>${ts('pronounceNote')}</p><p>${ts('pronounceSoon')}</p>`);
      });
    } catch {
      shell.openDialog(ts('tryPronounce'), `<p class="dialog-helper">${ts('demo')}</p><p>${ts('pronounceNote')}</p><p>${ts('pronounceSoon')}</p>`);
    }
   });

  output.querySelectorAll('[data-speak]').forEach(btn => {
   btn.addEventListener('click', () => {
    if (!isSpeechSupported()) { counter.textContent = ts('speechUnsupported'); return; }
    const lang = languageTag(btn.dataset.speakLang === entry.to ? toSel : fromSel);
    const textToSay = btn.dataset.speak === 'result' ? (btn.closest('.result-word-card')?.querySelector('.result-translation')?.textContent ?? entry.translation) : entry.example;
    const slow = btn.dataset.speakRate === 'slow';
    speak(textToSay, lang, { slow, onState: updateSpeechState });
   });
  });
  output.querySelector('[data-speak-stop]')?.addEventListener('click', () => { stop(); updateSpeechState(); });
 }

 function updateSpeechState() {
  const card = output.querySelector('.result-word-card');
  if (!card) return;
  const speaking = speechTarget !== null;
  setAudioState(card, { status: speaking ? 'speaking' : 'ended', target: speechTarget, rate: speechRate });
  if (!speaking) counter.textContent = isSpeechSupported() ? '' : ts('speechUnsupported');
 }

  if (route.word) {
  textarea.value = route.word;
  updateCounter();
   if(!live)doTranslate();
 }

 shell.updateConnection?.(navigator.onLine);
 window.addEventListener('online', () => shell.updateConnection?.(true));
 window.addEventListener('offline', () => shell.updateConnection?.(false));

  if(live)window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
   return () => { unsubscribe();stop();if(live){viewActive=false;invalidate();textarea.value='';output.replaceChildren();translationOperation=null;} };
},{active:'translator',demoMessage:()=>live?'Modelo local del servidor: requiere conexión con ese equipo. Diccionario y traducción automática son capacidades diferentes.':ts('demoNote')});
