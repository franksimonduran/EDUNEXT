import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { ts } from './translator-i18n.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc } from '../components/student-ui.js';
import { renderVocabularyCard } from '../components/vocabulary-card.js';
import { listWords, removeWord, listWords as getWords } from '../services/vocabulary.service.js';
import { languageName, categoryLabel } from '../utils/language-format.js';
import { getLocale } from './i18n.js';
import { speak, stop, isSpeechSupported } from '../services/speech.service.js';
import { languageTag } from '../utils/language-format.js';
import { dictionaryEntries } from '../data/dictionary-demo.data.js';

bootLearningPage(route => ({ route }), ({ route }) => {
 document.title = `${ts('vocabTitle')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 let words = listWords();
 const state = { search: '', lang: 'all', category: 'all', sort: 'recent' };

 function render() {
  const languages = [...new Set(words.map(w=>w.from + '-' + w.to))].map(pair => pair.split('-'));
  const categories = [...new Set(words.map(w=>w.category))];
  const filtered = words.filter(w => {
   if (state.search && !w.word.toLowerCase().includes(state.search.toLowerCase()) && !w.translation.toLowerCase().includes(state.search.toLowerCase())) return false;
   if (state.lang !== 'all') { const [f,t]=state.lang.split('-'); if (w.from!==f||w.to!==t) return false; }
   if (state.category !== 'all' && w.category !== state.category) return false;
   return true;
  }).sort((a,b) => state.sort === 'alpha' ? a.word.localeCompare(b.word, getLocale()) : words.indexOf(b) - words.indexOf(a));
  const langOptions = languages.map(([f,t]) => `<option value="${f}-${t}" ${state.lang===f+'-'+t?'selected':''}>${languageName(f)} → ${languageName(t)}</option>`).join('');
  const catOptions = categories.map(c => `<option value="${c}" ${state.category===c?'selected':''}>${categoryLabel(c)}</option>`).join('');
  root.innerHTML = `<header class="vocab-header"><div class="vocab-title-row"><span class="vocab-avatar" aria-hidden="true">${icon('bookmark')}</span><div class="vocab-heading"><span class="kicker">${ts('vocabDemo')}</span><h1>${ts('vocabTitle')}</h1><p>${ts('vocabSubtitle')}</p></div></div><div class="vocab-header-actions"><a class="button-secondary" href="${learningURL('translator',{grade:route.grade})}">${icon('language')}<span>${ts('goTranslator')}</span></a><a class="button-primary" href="${learningURL('review',{grade:route.grade})}">${icon('flip')}<span>${ts('startReview')}</span></a></div></header><div class="vocab-summary"><article class="summary-card"><strong>${words.length}</strong><span>${ts('wordsSaved')}</span></article><article class="summary-card"><strong>${new Set(words.flatMap(w=>[w.from,w.to])).size}</strong><span>${ts('languagesUsed')}</span></article><article class="summary-card"><strong>${words.length}</strong><span>${ts('reviewed')}</span></article><article class="summary-card"><strong>${categories.length}</strong><span>${ts('categoriesAvailable')}</span></article></div><p class="vocab-temporary">${ts('vocabTemporary')}</p><section class="vocab-filters"><label class="vocab-search">${icon('search')}<input id="vocab-search" type="search" placeholder="${esc(ts('search'))}" value="${esc(state.search)}"></label><select id="vocab-lang"><option value="all">${ts('all')}</option>${langOptions}</select><select id="vocab-cat"><option value="all">${ts('all')}</option>${catOptions}</select><select id="vocab-sort"><option value="recent" ${state.sort==='recent'?'selected':''}>${ts('sortRecent')}</option><option value="alpha" ${state.sort==='alpha'?'selected':''}>${ts('sortAlpha')}</option></select></section><section class="vocab-grid">${words.length? (filtered.length? filtered.map(renderVocabularyCard).join(''): `<div class="vocab-empty"><h2>${ts('noResults')}</h2></div>`) : `<div class="vocab-empty"><span class="placeholder-icon" aria-hidden="true">${icon('bookmark')}</span><h2>${ts('empty')}</h2><p>${ts('emptyNote')}</p><a class="button-primary" href="${learningURL('translator',{grade:route.grade})}">${ts('goTranslator')}</a></div>`}</section>`;
  root.querySelector('#vocab-search').addEventListener('input', e => { state.search = e.target.value; render(); });
  root.querySelector('#vocab-lang').addEventListener('change', e => { state.lang = e.target.value; render(); });
  root.querySelector('#vocab-cat').addEventListener('change', e => { state.category = e.target.value; render(); });
  root.querySelector('#vocab-sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  root.querySelectorAll('[data-remove-word]').forEach(btn => btn.addEventListener('click', () => { removeWord(btn.dataset.removeWord); words = listWords(); render(); }));
  root.querySelectorAll('[data-detail-word]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); const entry = words.find(w=>w.id===btn.dataset.detailWord); if(!entry)return; location.assign(`palabra.html?${new URLSearchParams({grade:route.grade,word:entry.word,from:entry.from,to:entry.to}).toString()}`); }));
  root.querySelectorAll('[data-speak]').forEach(btn => btn.addEventListener('click', () => { const entry = words.find(w=>w.id===btn.dataset.speak); if(!entry||!isSpeechSupported())return; stop(); speak(entry.word, languageTag(entry.from), { slow:false, onState:()=>{} }); }));
 }
 render();
 return () => stop();
},{active:'translator'});
