import {calculateScore} from '../utils/score-calculator.js';
import {escapeHTML as esc} from './student-ui.js';
import {text,t} from '../student/i18n.js';
import {pt} from '../student/practice-i18n.js';
export function formatAnswer(question,value){
 if(['multiple','boolean','image'].includes(question?.type))return question.options.find(option=>option.id===value)?.label??String(value??'');
 if(question?.type==='ordering')return Array.isArray(value)?value.map(id=>question.items.find(item=>item.id===id)?.label??id).join(' → '):'';
 if(question?.type==='matching')return question.pairs.map(pair=>`${pair.left} → ${question.pairs.find(item=>item.id===value?.[pair.id])?.right??'—'}`).join('; ');
 return typeof value==='object'?JSON.stringify(value):String(value??'');
}
export function renderResultSummary(activity,session){
 const score=calculateScore(session.records);
 const good=session.records.filter(record=>record.attempts[0]?.correct),review=session.records.filter(record=>record.attempts.length&&!record.attempts[0].correct);
 const topics=records=>[...new Set(records.map(record=>record.topic))].map(topic=>`<li lang="es">${esc(topic)}</li>`).join('');
 return `<header class="results-hero"><span class="demo-badge">${t('demo')}</span><h1>${pt(activity.kind==='game'?'gameFinished':'finished')}</h1><p lang="es">${esc(activity.name)}</p><p>${esc(text(activity.courseName))} · ${activity.grade}.º</p><div class="sample-stars" aria-label="${score.stars} ${pt('stars')}">${'★'.repeat(score.stars)}${'☆'.repeat(3-score.stars)}</div></header><dl class="result-metrics">${[[activity.type==='memory'?'moves':'answered',score.answered],['correctCount',score.correct],['incorrectCount',score.incorrect],['percent',`${score.percent}%`],['hintsUsed',score.hints],['points',score.points]].map(([key,value])=>`<div><dt>${pt(key)}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="score-policy">${pt(activity.type==='memory'?'memoryMetric':'first')} ${pt('rules')}</p><div class="formative-feedback"><section class="dashboard-card"><h2>${pt('strengths')}</h2>${good.length?`<ul>${topics(good)}</ul>`:`<p>${pt('noneStrengths')}</p>`}</section><section class="dashboard-card"><h2>${pt('reinforce')}</h2>${review.length?`<ul>${topics(review)}</ul>`:`<p>${pt('noneReinforce')}</p>`}</section></div><details class="answer-review" id="answer-review"><summary>${pt('review')}</summary>${session.records.map(record=>{const question=activity.questions.find(question=>question.id===record.id);return `<article><h3 lang="es">${esc(record.topic)}</h3><p><strong>${pt('answerGiven')}:</strong> <span lang="es">${esc(formatAnswer(question,record.attempts[0]?.answer))}</span></p><p>${pt(record.attempts[0]?.correct?'correct':'incorrect')}</p><p lang="es">${esc(record.explanation)}</p><small>${pt('attempts')}: ${record.attempts.length} · ${pt('hintsUsed')}: ${record.hintsUsed}</small></article>`;}).join('')}</details>`;
}
