import { bootLearningPage } from './learning-page.js';
import { learningURL } from './learning-routes.js';
import { ts } from './translator-i18n.js';
import { icon } from '../components/icons.js';
import { escapeHTML as esc } from '../components/student-ui.js';
import { renderFlashcard } from '../components/flashcard.js';
import { listWords } from '../services/vocabulary.service.js';
import { getReviewDemoSet } from '../data/vocabulary-demo.data.js';
import { speak, stop, isSpeechSupported } from '../services/speech.service.js';
import { languageTag } from '../utils/language-format.js';

function shuffleArr(arr) { return [...arr].sort(() => Math.random()-0.5); }

bootLearningPage(route => ({ route }), ({ route }) => {
 document.title = `${ts('reviewTitle')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 const saved = listWords();
 const state = { mode: 'flashcards', list: saved.length ? [...saved] : getReviewDemoSet('es','en',6), index: 0, revealed: false, correct: 0, total: 0, choices: [], match: { left: [], right: [], selected: null, done: 0 } };

 function render() {
  if (state.list.length === 0) {
   root.innerHTML = `<header class="review-header"><div class="review-title-row"><span class="review-avatar" aria-hidden="true">${icon('flip')}</span><div class="review-heading"><span class="kicker">${ts('reviewTitle')}</span><h1>${ts('reviewSubtitle')}</h1></div></div><a class="button-secondary" href="${learningURL('vocabulary',{grade:route.grade})}">← ${ts('vocabTitle')}</a></header><div class="review-layout"><section class="review-workspace"><div class="review-empty"><h2>${ts('reviewEmpty')}</h2><p>${ts('vocabSubtitle')}</p><a class="button-primary" href="${learningURL('translator',{grade:route.grade})}">${ts('goTranslator')}</a></div></section></div>`;
   return;
  }
  const modes = [['flashcards', ts('modeFlashcards')], ['choice', ts('modeChoice')], ['match', ts('modeMatch')]];
  root.innerHTML = `<header class="review-header"><div class="review-title-row"><span class="review-avatar" aria-hidden="true">${icon('flip')}</span><div class="review-heading"><span class="kicker">${ts('reviewTitle')}</span><h1>${ts('reviewSubtitle')}</h1></div></div><div class="review-header-actions"><a class="button-secondary" href="${learningURL('vocabulary',{grade:route.grade})}">${ts('vocabTitle')}</a><a class="button-secondary" href="${learningURL('translator',{grade:route.grade})}">${ts('goTranslator')}</a></div></header><div class="review-layout"><nav class="review-modes">${modes.map(([k,l])=>`<button class="mode-button ${state.mode===k?'is-active':''}" data-mode="${k}">${l}</button>`).join('')}</nav><section class="review-workspace">${renderMode()}</section></div>`;
  root.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => { state.mode = btn.dataset.mode; state.index=0; state.revealed=false; state.correct=0; state.total=0; initMode(); render(); }));
  bindMode();
 }

 function initMode() {
  if (state.mode === 'choice') {
   state.choices = buildChoices();
  }
  if (state.mode === 'match') {
   const list = shuffleArr(state.list).slice(0, Math.min(6, state.list.length));
   state.match = { left: list.map(e=>({id:e.id,type:'word',text:e.word,entry:e})), right: shuffleArr(list).map(e=>({id:e.id,type:'trans',text:e.translation,entry:e})), selected: null, done: 0 };
  }
 }

 function buildChoices() {
  const entry = state.list[state.index];
  const others = shuffleArr(state.list.filter(e=>e.id!==entry.id)).slice(0,3).map(e=>e.translation);
  const opts = shuffleArr([entry.translation, ...others]);
  return { entry, opts, answered: false, correct: entry.translation };
 }

 function renderMode() {
  if (state.mode === 'flashcards') return renderFlashcard(state.list[state.index], {index: state.index, total: state.list.length, revealed: state.revealed});
  if (state.mode === 'choice') {
   const c = state.choices || buildChoices();
   return `<div><p class="choice-question">${ts('choosePrompt')} <strong dir="auto">${esc(c.entry.word)}</strong></p><div class="choice-list">${c.opts.map((o,i)=>`<button class="choice-option" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
  }
  if (state.mode === 'match') {
   const m = state.match;
   return `<div><p>${ts('matchPrompt')}</p><p>${ts('matchProgress', {done: m.done, total: Math.min(6,state.list.length)})}</p><div class="match-grid"><div class="match-pair">${m.left.map(x=>`<button class="match-token" data-match-left="${x.id}">${esc(x.text)}</button>`).join('')}</div><div class="match-pair">${m.right.map(x=>`<button class="match-token" data-match-right="${x.id}">${esc(x.text)}</button>`).join('')}</div></div></div>`;
  }
  return '';
 }

 function bindMode() {
  if (state.mode === 'flashcards') {
   root.querySelector('[data-flash-toggle]')?.addEventListener('click', () => { state.revealed = !state.revealed; render(); });
   root.querySelector('[data-flash-prev]')?.addEventListener('click', () => { state.index = (state.index-1+state.list.length)%state.list.length; state.revealed=false; render(); });
   root.querySelector('[data-flash-next]')?.addEventListener('click', () => { state.index = (state.index+1)%state.list.length; state.revealed=false; render(); });
   root.querySelectorAll('[data-speak]').forEach(btn => btn.addEventListener('click', () => { const e = state.list[state.index]; if(!e||!isSpeechSupported())return; stop(); speak(e.translation, languageTag(e.to), {slow:btn.dataset.speakRate==='slow'}); }));
  }
  if (state.mode === 'choice') {
   const c = state.choices || buildChoices();
   root.querySelectorAll('[data-choice]').forEach(btn => btn.addEventListener('click', () => {
    if (c.answered) return;
    c.answered = true; state.total++;
    const ok = btn.dataset.choice === c.correct; if (ok) state.correct++;
    btn.classList.add(ok ? 'is-correct' : 'is-wrong');
    root.querySelectorAll('[data-choice]').forEach(b => { if (b.dataset.choice === c.correct) b.classList.add('is-correct'); b.disabled = true; });
    setTimeout(() => { if (state.index < state.list.length-1) { state.index++; state.choices = buildChoices(); render(); } else { showResults(); } }, 900);
   }));
  }
  if (state.mode === 'match') {
   root.querySelectorAll('[data-match-left]').forEach(btn => btn.addEventListener('click', () => { root.querySelectorAll('[data-match-left]').forEach(b=>b.classList.remove('is-selected')); btn.classList.add('is-selected'); state.match.selected = {side:'left',id:btn.dataset.matchLeft,btn}; tryMatch(); }));
   root.querySelectorAll('[data-match-right]').forEach(btn => btn.addEventListener('click', () => { root.querySelectorAll('[data-match-right]').forEach(b=>b.classList.remove('is-selected')); btn.classList.add('is-selected'); state.match.selected = {side:'right',id:btn.dataset.matchRight,btn}; tryMatch(); }));
  }
 }

 function tryMatch() {
  const m = state.match;
  if (!m.selected?.id) return;
  const other = m.selected.side === 'left' ? document.querySelector('.match-token.is-selected[data-match-right]') : document.querySelector('.match-token.is-selected[data-match-left]');
  if (!other) return;
  if (m.selected.side === 'left' && other.dataset.matchRight === m.selected.id) { m.selected.btn.classList.add('is-matched'); other.classList.add('is-matched'); m.selected.btn.disabled = true; other.disabled = true; m.done++; state.correct++; state.total = Math.min(6,state.list.length); root.querySelectorAll('.match-token.is-selected').forEach(b=>b.classList.remove('is-selected')); if (m.done >= Math.min(6,state.list.length)) setTimeout(showResults, 600); else render(); }
  else { root.querySelectorAll('.match-token.is-selected').forEach(b=>b.classList.remove('is-selected')); }
 }

 function showResults() {
  const total = state.mode === 'match' ? Math.min(6,state.list.length) : state.list.length;
  const pct = total ? Math.round((state.correct/total)*100) : 0;
  root.innerHTML = `<header class="review-header"><div class="review-title-row"><span class="review-avatar" aria-hidden="true">${icon('award')}</span><div class="review-heading"><span class="kicker">${ts('results')}</span><h1>${ts('reviewSubtitle')}</h1></div></div></header><div class="review-layout"><section class="review-workspace"><div class="review-results"><div class="results-score">${pct}%</div><ul class="results-list"><li>${ts('reviewedWords')}: ${total}</li><li>${ts('correctAnswers')}: ${state.correct}</li><li>${ts('incorrectAnswers')}: ${total-state.correct}</li></ul><p>${ts('accuracyNote')}</p><div class="review-header-actions"><button class="button-primary" id="restart">${ts('restart')}</button><a class="button-secondary" href="${learningURL('vocabulary',{grade:route.grade})}">${ts('vocabTitle')}</a></div></div></section></div>`;
  root.querySelector('#restart').addEventListener('click', () => { state.index=0; state.revealed=false; state.correct=0; state.total=0; initMode(); render(); });
 }

 initMode();
 render();
 return () => stop();
},{active:'translator'});
