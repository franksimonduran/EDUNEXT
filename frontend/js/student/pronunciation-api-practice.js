import {escapeHTML as esc} from '../components/student-ui.js';
import {beginPronunciationReference} from '../services/ai-api.service.js';

export function renderReferencePractice(root,entry){
 const controller=new AbortController();let utterance=null;
 root.innerHTML=`<header class="pron-header"><h1>Practicar: ${esc(entry.translation)}</h1><p>${esc(entry.word)} · ${esc(entry.to)}</p><p>Referencia local, sin análisis de pronunciación ni transcripción.</p></header><section class="pron-practice"><article class="pron-model"><h2>Lee y repite voluntariamente</h2><p class="pron-model-word">${esc(entry.translation)}</p><p>${esc(entry.exampleTranslation)}</p><button type="button" data-listen>Escuchar voz local del dispositivo</button><button type="button" data-stop>Detener</button><p>La voz solo se usa si el navegador declara un motor local disponible. No se activa el micrófono ni se sube audio.</p><button type="button" data-reference-session>Registrar sesión de referencia</button><p role="status" data-status aria-live="polite"></p><a class="button-secondary" href="pronuncia.html?modo=api">Volver a referencias</a></article></section>`;
 const status=root.querySelector('[data-status]');
 root.addEventListener('click',async event=>{
  if(event.target.closest('[data-listen]')){
   const voice=window.speechSynthesis?.getVoices().find(voice=>voice.localService&&voice.lang.toLowerCase().startsWith(entry.to));
   if(!voice||!window.SpeechSynthesisUtterance){status.textContent='No hay una voz local disponible. Puedes leer y repetir sin grabarte.';return;}
   window.speechSynthesis.cancel();utterance=new SpeechSynthesisUtterance(entry.translation);utterance.lang=voice.lang;utterance.voice=voice;
   utterance.onerror=()=>{status.textContent='La voz local no pudo reproducirse.';};
   window.speechSynthesis.speak(utterance);status.textContent='Reproduciendo con una voz local del dispositivo.';
  }
  if(event.target.closest('[data-stop]'))window.speechSynthesis?.cancel();
  const button=event.target.closest('[data-reference-session]');if(button){
   button.disabled=true;
   try{const session=await beginPronunciationReference(entry.id);status.textContent=`Sesión de referencia registrada: ${session.id}. Sin puntuación ni evaluación fonética.`;}
   catch(error){status.textContent=`No se confirmó el registro: ${error.message}`;button.disabled=false;}
  }
 },{signal:controller.signal});
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 return ()=>{controller.abort();window.speechSynthesis?.cancel();utterance=null;status.textContent='';};
}
