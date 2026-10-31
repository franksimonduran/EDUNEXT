import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { listPronunciationAttempts, clearPronunciationAttempts } from '../services/pronunciation.service.js';
import { ps } from './pronunciation-i18n.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc } from '../components/student-ui.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = `${ps('history')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 const grade = route.grade ? Number(route.grade) : 4;
 const attempts = listPronunciationAttempts();

 root.innerHTML = `<header class="pron-header">
  <div class="pron-title">
   <span class="pron-avatar" aria-hidden="true">${icon('mic')}</span>
   <div class="pron-heading">
    <span class="kicker">EDUNEXT PRONUNCIA</span>
    <h1>${ps('history')}</h1>
    <p>Intentos guardados en esta sesión (SessionStorage).</p>
   </div>
  </div>
  <div class="pron-header-actions">
   <a class="button-secondary" href="${learningURL('pronunciation',{grade})}">${ps('back')}</a>
   ${attempts.length ? `<button class="button-monitor" id="clear-hist">${ps('clearHistory')}</button>` : ''}
  </div>
 </header>
 <section class="pron-section">
  ${attempts.length ? `<div class="pron-history-list">
   ${attempts.map(a => `<article class="pron-history-item">
    <div>
     <h3>${esc(a.word || a.itemId)}</h3>
     <p class="pron-history-meta">${esc(a.lang || '')} · ${esc(a.createdAt ? new Date(a.createdAt).toLocaleString() : '')}</p>
    </div>
    <span class="pron-history-badge">${a.hasRecording ? 'Con grabación' : 'Sin grabación'}</span>
   </article>`).join('')}
  </div>` : `<p>${ps('noAttempts')}</p>`}
 </section>
 <p class="pron-privacy">${ps('privacyNote')}</p>`;

 root.querySelector('#clear-hist')?.addEventListener('click', () => {
  clearPronunciationAttempts();
  location.reload();
 });

 return () => {};
},{active:'pronunciation',demoMessage:()=>ps('privacyNote')});
