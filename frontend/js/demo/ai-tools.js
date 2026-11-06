import {GUIDED_TOPICS,getGuidedTopic,getGuidedPrompt,getSuggestedPrompt,DEMO_CAPABILITIES} from './ai-guided.js';
import {getDemoEvidence,DEMO_CONTEXT} from './metrics.js';
import {DEMO_LANGUAGE_PAIRS,getDemoVocabulary,lookupDemoTranslation} from './translation.js';
import {listDemoPronunciation,isSpeechDemoAvailable,speakDemoWord,demoPronunciationExercise} from './pronunciation.js';

const root=document.querySelector('#d3-content');
const mode=document.body?.dataset.d3Mode;
const escapeHTML=(value)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const notice=(text,kind='info')=>`<p class="d3-status" role="status" data-kind="${kind}">${escapeHTML(text)}</p>`;
const questionLabel=(q)=>escapeHTML(q.question);
const option=(value,label,selected=false)=>`<option value="${escapeHTML(value)}" ${selected?'selected':''}>${escapeHTML(label)}</option>`;
function setNav(){
 const active={tutor:'tutor-demo.html',translate:'traductor-demo.html',pronounce:'pronuncia-demo.html'}[mode];
 if(active){const link=document.querySelector(`.d3-header a[href*="${active}"]`);link?.setAttribute('aria-current','page');}
}
function tutorPage(){
 const suggestion=getSuggestedPrompt();
 root.innerHTML=`<div class="d3-layout">
  <section class="d3-card"><span class="d3-badge">Tutor de respuestas guiadas</span><h2>Elige un tema</h2>
    <div class="d3-field"><label for="d3-topic">Área de aprendizaje</label><select id="d3-topic">${GUIDED_TOPICS.map(t=>option(t.id,t.title,t.id===suggestion.topic)).join('')}</select></div>
    <div class="d3-field"><label for="d3-prompt">Pregunta educativa</label><select id="d3-prompt"></select></div>
    <div class="d3-actions"><button type="button" id="d3-answer">Mostrar explicación</button><a class="secondary" href="recorrido-demo.html?modo=demo">Volver a la lectura</a></div>
    <p class="d3-small">Las respuestas están escritas de antemano. No se analiza texto libre ni se consulta a ningún modelo.</p>
  </section>
  <section class="d3-card"><h2>Tu asistente de aprendizaje</h2><p>Selecciona una pregunta y recibe una explicación paso a paso, con una actividad de refuerzo.</p>
    <div id="d3-response" aria-live="polite">${notice('Selecciona una pregunta para abrir una respuesta pedagógica preparada.')}</div>
    <div class="d3-callout"><strong>Aprender desde los errores</strong><p id="d3-learning-note">Revisa tu práctica de comprensión lectora para obtener orientación contextual.</p></div>
  </section></div>`;
 const topic=root.querySelector('#d3-topic'),prompt=root.querySelector('#d3-prompt'),response=root.querySelector('#d3-response');
 const updateQuestions=(wanted=null)=>{
  const t=getGuidedTopic(topic.value);
  prompt.replaceChildren();
  for(const p of t?.prompts??[]){const o=document.createElement('option');o.value=p.id;o.textContent=p.question;prompt.add(o);}
  if(wanted&&getGuidedPrompt(topic.value,wanted))prompt.value=wanted;
  response.innerHTML=notice('Pregunta elegida. Pulsa «Mostrar explicación» para verla.');
 };
 const params=new URLSearchParams(location.search);
 const requestedTopic=params.get('topic'),requestedPrompt=params.get('prompt');
 if(getGuidedTopic(requestedTopic))topic.value=requestedTopic;
 topic.addEventListener('change',()=>updateQuestions());
 updateQuestions(requestedPrompt||suggestion.prompt);
 root.querySelector('#d3-answer').addEventListener('click',()=>{
  const p=getGuidedPrompt(topic.value,prompt.value);
  if(!p){response.innerHTML=notice('Esta pregunta no está disponible.','warn');return;}
  response.innerHTML=`<article class="d3-answer"><span class="d3-badge">Respuesta pedagógica preparada · No generada por IA</span>
   <h3>${questionLabel(p)}</h3><p>${escapeHTML(p.answer)}</p><h3>Ahora practica</h3><p>${escapeHTML(p.activity)}</p></article>`;
 });
 const evidence=getDemoEvidence();const node=root.querySelector('#d3-learning-note');
 node.textContent=evidence.completed? (evidence.percent<80?`Tu práctica ficticia obtuvo ${evidence.percent} %. Prueba la pregunta «¿Qué hago si me equivoco en la práctica?» y revisa las explicaciones.`:`Tu práctica ficticia obtuvo ${evidence.percent} %. Puedes seguir explorando detalles e ideas principales.`) :'Todavía no has completado la práctica guiada de comprensión lectora.';
}
function translatePage(){
 root.innerHTML=`<div class="d3-layout">
 <section class="d3-card"><span class="d3-badge">Diccionario revisado · No traducción libre</span><h2>Consulta vocabulario</h2>
 <div class="d3-field"><label for="d3-pair">Dirección</label><select id="d3-pair">${DEMO_LANGUAGE_PAIRS.map(p=>option(p.from+'-'+p.to,p.label)).join('')}</select></div>
 <div class="d3-field"><label for="d3-vocab">Ejemplos locales</label><select id="d3-vocab"></select></div>
 <div class="d3-field"><label for="d3-search">Palabra o expresión exacta</label><input id="d3-search" type="text" maxlength="120" autocomplete="off" placeholder="Ejemplo: Escuela"></div>
 <div class="d3-actions"><button type="button" id="d3-translate">Consultar diccionario</button><button class="secondary" type="button" id="d3-swap">Invertir idiomas</button></div>
 <p class="d3-small">Si una palabra no existe en los datos locales, se informa sin inventar equivalencias.</p>
 </section>
 <section class="d3-card"><h2>Resultado educativo</h2><div id="d3-translation-result">${notice('Selecciona una palabra local o escríbela exactamente.')}</div>
 <div class="d3-callout"><strong>Aprende también a pronunciar</strong><p>Escucha vocabulario de referencia desde el navegador si el equipo dispone de una voz compatible.</p>
 <div class="d3-actions"><a class="secondary" href="pronuncia-demo.html?modo=demo">Abrir Pronuncia</a><button type="button" class="secondary" id="d3-speak-translation" disabled>Escuchar traducción</button></div>
 <p id="d3-speech-status" class="d3-small" role="status"></p></div></section></div>`;
 const pair=root.querySelector('#d3-pair'),vocab=root.querySelector('#d3-vocab'),search=root.querySelector('#d3-search'),out=root.querySelector('#d3-translation-result'),speakButton=root.querySelector('#d3-speak-translation'),speechStatus=root.querySelector('#d3-speech-status');
 let current=null;
 const updateVocab=()=>{
  const [from,to]=pair.value.split('-');
  vocab.replaceChildren();
  for(const item of getDemoVocabulary(from,to)){const o=document.createElement('option');o.value=item.word;o.textContent=item.word+' · '+item.topic;vocab.add(o);}
  search.value=vocab.value||'';current=null;speakButton.disabled=true;
  out.innerHTML=notice('Selecciona un término y pulsa «Consultar diccionario».');
 };
 vocab.addEventListener('change',()=>{search.value=vocab.value;current=null;speakButton.disabled=true;});
 pair.addEventListener('change',updateVocab);
 root.querySelector('#d3-swap').addEventListener('click',()=>{pair.value=pair.value==='es-en'?'en-es':'es-en';updateVocab();});
 search.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();root.querySelector('#d3-translate')?.click();}});
 root.querySelector('#d3-translate').addEventListener('click',()=>{
  const [from,to]=pair.value.split('-');const result=lookupDemoTranslation(search.value,from,to);
  current=result.status==='found'?{...result,to}:null;speakButton.disabled=!current;
  if(result.status!=='found'){out.innerHTML=notice(result.message||'No disponible','warn');return;}
  out.innerHTML=`<div class="d3-translation"><div class="d3-box"><span class="d3-small">${from==='es'?'Español':'Inglés'}</span><div class="d3-value">${escapeHTML(result.word)}</div></div>
  <div class="d3-box"><span class="d3-small">${to==='en'?'Inglés':'Español'}</span><div class="d3-value">${escapeHTML(result.translation)}</div></div></div>
  <p><strong>Área:</strong> ${escapeHTML(result.topic)}</p><p><strong>Ejemplo:</strong> ${escapeHTML(result.example)}</p><p><strong>Equivalencia:</strong> ${escapeHTML(result.exampleTranslation)}</p>${notice('Resultado obtenido del diccionario local incluido en EDUNEXT.','good')}`;
 });
 speakButton.addEventListener('click',()=>{
  if(!current)return;const speech=globalThis.speechSynthesis,U=globalThis.SpeechSynthesisUtterance;
  if(!speech||typeof speech.speak!=='function'||typeof U!=='function'){speechStatus.textContent='Este navegador no ofrece síntesis de voz compatible.';return;}
  try{speech.cancel();const u=new U(current.translation);u.lang=current.to==='en'?'en-US':'es-PE';u.rate=.85;speech.speak(u);speechStatus.textContent='Lectura solicitada al dispositivo. La disponibilidad depende de las voces instaladas.';}
  catch{speechStatus.textContent='La reproducción de voz no está disponible en este dispositivo.';}
 });
 updateVocab();
}
function pronouncePage(){
 const items=listDemoPronunciation();
 root.innerHTML=`<div class="d3-layout">
 <section class="d3-card"><span class="d3-badge">Vocabulario inglés · 5.º grado</span><h2>Escucha y aprende</h2>
 <div class="d3-field"><label for="d3-word">Palabra de práctica</label><select id="d3-word">${items.map(i=>option(i.id,i.word+' · '+i.topic)).join('')}</select></div>
 <div class="d3-callout"><span class="d3-small">PALABRA</span><div id="d3-pron-word" class="d3-value"></div><p id="d3-pron-example"></p></div>
 <div class="d3-actions"><button type="button" id="d3-listen">Escuchar en inglés</button><button class="secondary" type="button" id="d3-repeat">Repetir mentalmente</button></div>
 <p class="d3-voice-warning" id="d3-voice-notice" role="status">${isSpeechDemoAvailable()?'Voz de navegador disponible para intentar reproducir. No se usa micrófono.':'Síntesis de voz no detectada; puedes leer y repetir la palabra sin audio.'}</p></section>
 <section class="d3-card"><h2>Verifica el significado</h2><p>Selecciona la traducción correcta. El sistema verifica vocabulario escrito; no analiza tu pronunciación.</p>
 <div class="d3-field"><label for="d3-meaning">¿Qué significa esta palabra?</label><select id="d3-meaning"></select></div>
 <div class="d3-actions"><button type="button" id="d3-check-meaning">Comprobar significado</button><a class="secondary" href="traductor-demo.html?modo=demo">Consultar diccionario</a></div>
 <div id="d3-pron-result">${notice('Elige un significado para practicar.')}</div>
 <p class="d3-voice-warning">No se solicita permiso de micrófono, no se graba voz, no se calculan notas fonéticas.</p>
 </section></div>`;
 const word=root.querySelector('#d3-word'),meaning=root.querySelector('#d3-meaning'),label=root.querySelector('#d3-pron-word'),example=root.querySelector('#d3-pron-example'),result=root.querySelector('#d3-pron-result'),voice=root.querySelector('#d3-voice-notice');
 function current(){return items.find(i=>i.id===word.value);}
 function update(){
  const item=current();if(!item)return;
  label.textContent=item.word;example.textContent=item.example;
  meaning.replaceChildren();
  const answers=[item.translation,...items.filter(i=>i.id!==item.id).slice(0,3).map(i=>i.translation)].sort((a,b)=>a.localeCompare(b,'es'));
  const empty=document.createElement('option');empty.value='';empty.textContent='Selecciona una respuesta';meaning.add(empty);
  for(const answer of [...new Set(answers)]){const o=document.createElement('option');o.value=answer;o.textContent=answer;meaning.add(o);}
  meaning.value='';result.innerHTML=notice('Selecciona una traducción y comprueba tu respuesta.');
 }
 word.addEventListener('change',update);
 root.querySelector('#d3-listen').addEventListener('click',()=>{
  const item=current();if(!item)return;const state=speakDemoWord(item.word);
  voice.textContent=state.status==='requested'?'La lectura se solicitó al dispositivo (voz opcional; no se evalúa).':'No se pudo usar la síntesis de voz. Sigue con la práctica escrita.';
 });
 root.querySelector('#d3-repeat').addEventListener('click',()=>{voice.textContent='Ahora repite la palabra en voz alta, si deseas. EDUNEXT no escucha ni guarda audio.';});
 root.querySelector('#d3-check-meaning').addEventListener('click',()=>{
  const item=current();if(!item||!meaning.value){result.innerHTML=notice('Selecciona un significado para continuar.','warn');return;}
  const r=demoPronunciationExercise(item.word,meaning.value);
  result.innerHTML=notice(r.matched?'¡Correcto! '+item.word+' significa '+item.translation+'. No se calificó tu voz.':'No coincide con el significado de referencia. Repasa la palabra e inténtalo de nuevo.',r.matched?'good':'warn');
 });
 update();
}
function capabilitiesPage(){
 const who=mode==='monitor'?'Monitor / Docente':'Administrador';
 root.innerHTML=`<div class="d3-card"><span class="d3-badge">Estado informativo · ${who}</span><h2>Capacidades de esta publicación</h2><p>Estas etiquetas indican qué puede demostrar el frontend estático; no informan de permisos ni sesiones reales.</p>
 <div class="d3-grid">${DEMO_CAPABILITIES.map(cap=>`<section class="d3-card"><h3>${escapeHTML(cap.name)}</h3><span class="d3-badge">${escapeHTML(cap.status)}</span><p>${escapeHTML(cap.detail)}</p></section>`).join('')}</div>
 <div class="d3-actions"><a href="../student/tutor-demo.html?modo=demo">Probar Tutor guiado</a><a class="secondary" href="../student/traductor-demo.html?modo=demo">Ver Translate</a><a class="secondary" href="../student/pronuncia-demo.html?modo=demo">Ver Pronuncia</a><a class="secondary" href="${mode==='monitor'?'../monitor/index.html':'../admin/index.html'}?modo=demo">Volver al panel</a></div>
 <p class="d3-voice-warning">Sin estadísticas individuales de uso de IA ni datos de alumnos. No certifica modelos generativos, traducción libre ni reconocimiento de voz.</p></div>`;
}
if(root){
 setNav();
 if(mode==='tutor')tutorPage();
 if(mode==='translate')translatePage();
 if(mode==='pronounce')pronouncePage();
 if(mode==='monitor'||mode==='admin')capabilitiesPage();
}
