import { validateAnswer } from './evaluation-validation.js';

export function computeDemoScore(questions, answers){
 let correct=0, objective=0;
 for(const q of questions){
  if(q.type==='open') continue;
  objective++;
  if(validateAnswer(q, answers[q.id]).ok && Array.isArray(q.correct) && q.correct.length && !(q.type==='word')) {
   // check exact match for simple
   const v = answers[q.id];
   if(Array.isArray(q.correct)){
    if(q.type==='boolean'||q.type==='multiple') if(q.correct.includes(v)) correct++;
    else if(q.type==='word') { const vv=String(v||'').toLowerCase().trim(); if(q.correct.map(x=>x.toLowerCase()).includes(vv)) correct++; }
    else if(q.type==='numeric') { const vv=String(v||'').trim(); if(q.correct.includes(vv)) correct++; }
   }
  } else if(q.type==='word' || q.type==='numeric'){
   if(validateAnswer(q,answers[q.id]).ok) correct++;
  }
 }
 const pct = objective===0?0: Math.round((correct/objective)*100);
 return { correct, objective, open: questions.filter(q=>q.type==='open').length, pct };
}
