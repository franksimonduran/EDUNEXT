import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { getPronunciationItem } from '../data/pronunciation-demo.data.js';
import { ps } from './pronunciation-i18n.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = `Resultado | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 const grade = route.grade ? Number(route.grade) : 4;
 const id = route.id || null;
 const item = id ? getPronunciationItem(id) : null;

 root.innerHTML = `<header class="pron-header">
  <div class="pron-title">
   <span class="pron-avatar" aria-hidden="true">${icon('mic')}</span>
   <div class="pron-heading">
    <span class="kicker">EDUNEXT PRONUNCIA</span>
    <h1>Resultado de práctica</h1>
    <p>Modo demostrativo. Sin evaluación automática.</p>
   </div>
  </div>
  <div class="pron-header-actions">
   <a class="button-secondary" href="${learningURL('pronunciation',{grade})}">Volver</a>
   <a class="button-secondary" href="${learningURL('pronunciation-history',{grade})}">${ps('history')}</a>
  </div>
 </header>
 <section class="pron-section">
  <article class="pron-result-card">
   <h2>${item ? item.word : 'Práctica'}</h2>
   <p>${ps('privacyNote')}</p>
   <div class="pron-result-actions">
    <a class="button-primary" href="${learningURL('pronunciation-practice',{grade,id:item?.id})}">${ps('tryAgain')}</a>
   </div>
  </article>
 </section>`;
 return () => {};
},{active:'pronunciation',demoMessage:()=>ps('privacyNote')});
