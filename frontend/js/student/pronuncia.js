import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { getPronunciationItems } from '../data/pronunciation-demo.data.js';
import { renderPronunciationCard } from '../components/pronunciation-card.js';
import { icon } from '../components/icons.js';
import { ps } from './pronunciation-i18n.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {getPronunciationReferences} from '../services/ai-api.service.js';
import {escapeHTML as esc} from '../components/student-ui.js';

const live=useProgressApi();

bootLearningPage(async route => {
 if(!live)return {route,grade:route.grade};
 try{return {route,references:await getPronunciationReferences()};}catch(error){return {route,error};}
}, ({ route,references,error }, _route, shell) => {
 document.title = `${ps('title')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 if(error){root.innerHTML=`<section role="alert"><h1>Referencias no disponibles</h1><p>${esc(error.message)}</p><p>No se utiliza contenido demo como análisis de voz.</p></section>`;return ()=>{};}
 if(live){
  root.innerHTML=`<header class="pron-header"><h1>EDUNEXT PRONUNCIA</h1><p>Vocabulario de referencia. Reconocimiento de voz y análisis fonético no disponibles.</p></header><section class="pron-section"><div class="pron-list">${references.items.map(entry=>renderPronunciationCard({item:{id:entry.id,word:entry.translation,translation:entry.word,lang:entry.to,example:entry.exampleTranslation,difficulty:'reference',topic:entry.topic||'Vocabulario'},href:`practicar-pronunciacion.html?modo=api&id=${encodeURIComponent(entry.id)}`})).join('')}</div></section><p>No se activa el micrófono. Puedes leer, escuchar si existe una voz local y repetir voluntariamente.</p>`;
  return ()=>{};
 }
 const grade = route.grade ? Number(route.grade) : 4;
 const items = getPronunciationItems({ grade, lang: 'en' });

 root.innerHTML = `<header class="pron-header">
  <div class="pron-title">
   <span class="pron-avatar" aria-hidden="true">${icon('mic')}</span>
   <div class="pron-heading">
    <span class="kicker">EDUNEXT PRONUNCIA</span>
    <h1>${ps('title')}</h1>
    <p>${ps('description')}</p>
   </div>
  </div>
  <div class="pron-header-actions">
   <span class="pron-mode">${ps('demo')}</span>
   <a class="button-secondary" href="${learningURL('pronunciation-history',{grade})}">${ps('history')}</a>
  </div>
 </header>
 <section class="pron-section" aria-label="Práctica de pronunciación">
  <div class="pron-list">
   ${items.length ? items.map(item => {
    const href = learningURL('pronunciation-practice',{grade, id:item.id});
    return renderPronunciationCard({ item, href });
   }).join('') : '<p>No hay elementos para este grado.</p>'}
  </div>
 </section>
 <p class="pron-privacy">${ps('privacyNote')}</p>`;
 return () => {};
},{active:'pronunciation',demoMessage:()=>live?'Modo API: práctica de referencia sin análisis de audio.':ps('privacyNote')});
