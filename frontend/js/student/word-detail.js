import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { ts } from './translator-i18n.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc } from '../components/student-ui.js';
import { categoryLabel, languageName } from '../utils/language-format.js';
import { dirAttributes } from '../utils/text-direction.js';
import { renderAudioControls } from '../components/audio-controls.js';
import { listWords, toggleWord, hasWord } from '../services/vocabulary.service.js';
import { findEntry, dictionaryEntries } from '../data/dictionary-demo.data.js';
import { speak, stop, isSpeechSupported } from '../services/speech.service.js';
import { languageTag } from '../utils/language-format.js';

bootLearningPage(route => ({ route }), ({ route }) => {
 document.title = `${ts('detailTitle')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 const normalize = value => String(value ?? '').trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
 const entry = route.word && route.from && route.to
  ? (findEntry(route.from, route.to, route.word) ?? dictionaryEntries.find(e => e.from === route.from && e.to === route.to && normalize(e.word) === normalize(route.word)))
  : null;
 if (!entry) {
  root.innerHTML = `<header class="word-header"><div class="word-header-row"><span class="word-avatar" aria-hidden="true">${icon('search')}</span><div class="word-heading"><span class="kicker">${ts('detailTitle')}</span><h1>${ts('notFoundTitle')}</h1><p>${ts('notFoundNote')}</p></div></div><a class="button-secondary" href="${learningURL('translator',{grade:route.grade})}">← ${ts('backTranslator')}</a></header><div class="word-not-found"><p>${ts('notFoundNote')}</p><a class="button-primary" href="${learningURL('translator',{grade:route.grade})}">${ts('backTranslator')}</a></div>`;
  return;
 }
 const saved = hasWord(entry.id);
 function render() {
  root.innerHTML = `<header class="word-header"><div class="word-header-row"><span class="word-avatar" aria-hidden="true">${icon('bookmark')}</span><div class="word-heading"><span class="kicker">${ts('detailTitle')}</span><h1>${esc(entry.word)}</h1><p>${esc(entry.translation)}</p></div></div><div class="word-actions"><a class="button-secondary" href="${learningURL('translator',{grade:route.grade,word:entry.word,from:entry.from,to:entry.to})}">← ${ts('backTranslator')}</a><a class="button-secondary" href="${learningURL('vocabulary',{grade:route.grade})}">${ts('vocabTitle')}</a><a class="button-primary" href="${learningURL('review',{grade:route.grade})}">${ts('review')}</a></div></header><div class="word-grid"><section class="word-main-card"><h2>${ts('meaning')}</h2><p class="word-translation" ${dirAttributes(entry.to)}>${esc(entry.translation)}</p><p class="word-original" ${dirAttributes(entry.from)}>${esc(entry.word)}</p><div class="word-example"><h2>${ts('example')}</h2><p ${dirAttributes(entry.from)}>${esc(entry.example)}</p><p ${dirAttributes(entry.to)}>${esc(entry.exampleTranslation)}</p></div>${renderAudioControls({target:'detail',lang:entry.to,label:ts('listen')})}<p class="speech-note">${ts('speechNote')}</p><button class="button-primary" id="word-save" aria-pressed="${saved}">${icon('star')}<span id="word-save-label">${saved?ts('remove'):ts('save')}</span></button></section><aside class="word-side-card"><h2>${ts('detail')}</h2><ul class="word-list"><li><span class="word-list-label">${ts('detailLangs')}</span><span>${languageName(entry.from)} → ${languageName(entry.to)}</span></li><li><span class="word-list-label">${ts('detailCategory')}</span><span>${categoryLabel(entry.category)}</span></li>${entry.topic?`<li><span class="word-list-label">${ts('topic')}</span><span>${esc(entry.topic)}</span></li>`:''}<li><span class="word-list-label">${ts('favorite')}</span><span id="word-fav-state">${saved?ts('yes'):ts('no')}</span></li></ul><p>${ts('meaningNote')}</p><button class="button-monitor" id="word-pronounce">${esc(ts('tryPronounce'))}</button></aside></div>`;
  root.querySelector('#word-save').addEventListener('click', () => { const r = toggleWord(entry); document.querySelector('#word-save').setAttribute('aria-pressed', String(r.saved)); document.querySelector('#word-save-label').textContent = r.saved?ts('remove'):ts('save'); document.querySelector('#word-fav-state').textContent = r.saved?ts('yes'):ts('no'); });
  root.querySelector('#word-pronounce').addEventListener('click', () => { alert(ts('pronounceSoon')); });
  root.querySelectorAll('[data-speak]').forEach(btn => btn.addEventListener('click', () => { if(!isSpeechSupported())return; stop(); speak(entry.translation, languageTag(entry.to), {slow:btn.dataset.speakRate==='slow'}); }));
 }
 render();
 return () => stop();
},{active:'translator'});
