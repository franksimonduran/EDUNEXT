import {LocalTutorService,LOCAL_MODEL_ID} from '../services/local-tutor.service.js';
import {onAuthenticationCleared} from '../services/auth.service.js';
import {selectLocalTopic} from '../utils/local-tutor-topic.js';
import {validateLocalQuestion} from '../services/local-tutor.service.js';

const messages={WASM_UNAVAILABLE:'Este navegador no permite ejecutar la IA local.',RUNTIME_UNAVAILABLE:'No se pudo iniciar el motor local. Revisa los archivos instalados.',MODEL_NOT_INSTALLED:'Faltan archivos del modelo local. Revisa la instalación.',PRIVATE_INPUT:'No escribas datos personales, correos, teléfonos ni enlaces.',INVALID_INPUT:'Escribe una pregunta de 1 a 500 caracteres.',UNSUPPORTED_INPUT:'Esta prueba no admite exámenes, cambios de notas ni instrucciones peligrosas.',INCOMPLETE_OUTPUT:'La respuesta no terminó a tiempo. Prueba con una pregunta más breve.',INVALID_OUTPUT:'No se obtuvo una respuesta válida. Consulta a tu docente.',TIMEOUT:'Se agotó el tiempo. Vuelve a iniciar la IA.',STOPPED:'IA detenida. El modelo y los datos offline se conservan.'};

export function mountLocalTutor(root,model){
 const service=new LocalTutorService(),events=new AbortController();let active=true,version=0,choice=null;
 root.innerHTML=`<section class="local-tutor" aria-labelledby="local-tutor-title">
 <header class="local-chat-header"><div><h2 id="local-tutor-title">IA local</h2><p>Experimental · Solo pruebas con datos ficticios. Puede equivocarse.</p></div><button type="button" class="button-secondary" id="local-model-stop">Detener</button></header>
 <div class="local-start"><label class="local-consent"><input id="local-model-consent" type="checkbox"> Equipo propio o autorizado. Acepto usar solo textos ficticios.</label><button type="button" class="button-primary" id="local-model-load" disabled>Iniciar IA</button></div>
 <p id="local-model-status" role="status" aria-live="polite">Confirma el uso del equipo y pulsa Iniciar IA.</p><progress id="local-model-progress" max="1" value="0" hidden aria-label="Carga del modelo"></progress>
 <div class="local-chat-log" id="local-answer" role="log" aria-label="Conversación local" aria-live="polite" aria-relevant="additions" tabindex="0"><p class="local-chat-welcome">¿Qué quieres aprender hoy?</p></div>
 <form id="local-question-form"><label class="sr-only" for="local-question">Escribe tu pregunta</label><textarea id="local-question" rows="2" maxlength="500" placeholder="Escribe tu pregunta…" disabled required aria-describedby="local-question-note"></textarea><div class="local-composer-footer"><p id="local-question-note">Sin datos personales · Máximo 500 caracteres</p><button type="submit" class="button-primary" id="local-question-send" disabled>Enviar</button></div></form>
 <details class="local-support"><summary>Tema de apoyo · Cambiar</summary><label for="local-lesson">Selecciona un tema</label><select id="local-lesson"></select><details><summary>Ver material de apoyo</summary><p id="local-lesson-note"></p></details></details>
 <p class="local-memory-note">Historial solo en esta vista. Cada pregunta se procesa por separado, sin recordar mensajes anteriores.</p>
 <details class="local-model-details"><summary>Detalles del modelo</summary><p id="local-model-name"></p><p>Funciona en este navegador con CPU y WebAssembly. Lee aproximadamente 1.5 GB de archivos y necesita varios GB de memoria. Puede tardar minutos y consumir batería.</p><p>No accede a cuentas, notas ni conversaciones privadas. No cambia al servicio online automáticamente. Sin internet requiere los archivos ya instalados; reabrir toda la aplicación offline no está verificado.</p><p>Prueba interna, no tutor institucional ni evaluación verificada. No aprobado para alumnos reales.</p></details></section>`;
 const get=id=>root.querySelector('#'+id),consent=get('local-model-consent'),load=get('local-model-load'),send=get('local-question-send'),question=get('local-question'),status=get('local-model-status'),progress=get('local-model-progress'),answer=get('local-answer'),select=get('local-lesson');
 get('local-model-name').textContent=LOCAL_MODEL_ID;
 for(const [index,item]of model.examples.entries())select.add(new Option(item.title,String(index)));
 const context=()=>model.examples[Number(select.value)];
 const showContext=()=>{get('local-lesson-note').textContent=context()?.explanation??'Sin material de apoyo.';};showContext();
 const update=()=>{
  load.disabled=!consent.checked||service.loading||service.ready;
  load.textContent=service.loading?'Iniciando IA…':service.ready?'IA iniciada':'Iniciar IA';
  load.setAttribute('aria-busy',String(service.loading));load.hidden=service.ready;
  root.querySelector('.local-consent').hidden=service.ready;
  send.disabled=!service.ready||service.busy;question.disabled=!service.ready||service.busy;select.disabled=service.busy;
  answer.setAttribute('aria-busy',String(service.busy));
 };
 load.setAttribute('aria-describedby','local-model-status');update();
 const resetChat=()=>{answer.replaceChildren();const p=document.createElement('p');p.className='local-chat-welcome';p.textContent='¿Qué quieres aprender hoy?';answer.append(p);};
 const append=(role,text)=>{
  answer.querySelector('.local-chat-welcome')?.remove();
  const message=document.createElement('div');message.className='local-chat-message local-chat-'+role;
  const label=document.createElement('strong');label.textContent=role==='user'?'Tú':'IA local';
  const body=document.createElement('p');body.textContent=text;message.append(label,body);answer.append(message);
  while(answer.children.length>40)answer.firstElementChild.remove();
  answer.scrollTop=answer.scrollHeight;
 };
  const stop=()=>{version++;choice=null;service.dispose();consent.checked=false;question.value='';resetChat();progress.hidden=true;status.textContent=messages.STOPPED;update();};
 consent.addEventListener('change',()=>{if(!consent.checked)stop();update();},{signal:events.signal});
 get('local-model-stop').addEventListener('click',stop,{signal:events.signal});
 select.addEventListener('change',()=>{if(choice)choice.selected=choice.candidates.includes(Number(select.value))?Number(select.value):null;showContext();},{signal:events.signal});
 load.addEventListener('click',async()=>{
  if(!active||service.loading||service.ready||!consent.checked)return;
  const current=++version;status.textContent='Iniciando IA local…';progress.value=0;progress.hidden=false;
  const pending=service.load({consent:consent.checked,onProgress:value=>{if(active&&version===current){progress.value=value;status.textContent=`Iniciando IA: ${Math.round(value*100)} %`;}}});update();
  try{await pending;if(active&&version===current)status.textContent='Lista para conversar';}
  catch(error){if(active&&version===current)status.textContent=messages[error.code]??'No se pudo iniciar la IA en este equipo.';}
  finally{if(active&&version===current){progress.hidden=true;update();}}
 },{signal:events.signal});
 get('local-question-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!service.ready||service.busy||!question.value.trim())return;
  let text;
  try{text=validateLocalQuestion(question.value);}catch(error){status.textContent=messages[error.code]??'Revisa tu pregunta.';return;}
  const topic=selectLocalTopic(text,model.examples);
  let index=topic.index;
  if(topic.kind==='missing'){choice=null;status.textContent='No encontré material relacionado en este grado. Prueba con un tema más concreto; no usaré otro tema como respuesta.';return;}
  if(topic.kind==='ambiguous'){
   if(choice?.text===text&&choice.selected!==null&&topic.candidates.includes(choice.selected))index=choice.selected;
   else{choice={text,candidates:topic.candidates,selected:null};status.textContent='Encontré varios temas: '+topic.candidates.slice(0,5).map(i=>model.examples[i].title).join(' · ')+'. Elige uno en Tema de apoyo y vuelve a enviar, o concreta tu pregunta.';root.querySelector('.local-support').open=true;select.focus();return;}
  }
  select.value=String(index);showContext();choice=null;
  const current=++version;status.textContent='Tema: '+context().title+' · Pensando en este equipo…';
  // Append only after validation/generation succeeds: rejected private input must not enter the log.
  const pending=service.ask(text,context(),model.grade);update();
  try{const result=await pending;if(active&&version===current){append('user',text);append('assistant',result);question.value='';status.textContent='Respuesta experimental · Verifica la información.';}}
  catch(error){if(active&&version===current)status.textContent=messages[error.code]??'No se obtuvo respuesta. Prueba de nuevo.';}
  finally{if(active&&version===current)update();}
 },{signal:events.signal});
 const unsubscribe=onAuthenticationCleared(stop);
 return ()=>{active=false;stop();unsubscribe();events.abort();root.replaceChildren();};
}
