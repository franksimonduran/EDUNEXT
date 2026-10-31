const normalize=(s,r={})=>{let v=String(s??'');if(r.trim!==false)v=v.trim().replace(/\s+/g,' ');if(r.ignoreCase)v=v.toLocaleLowerCase('es');return v;};
export function objectiveScore(q,value){
 if(q.type==='open')return null;
 let ok=false;
 if(['multiple','boolean','image'].includes(q.type))ok=q.correct.includes(value);
 if(q.type==='word')ok=q.correct.some(c=>normalize(c,q.rules)===normalize(value,q.rules));
 if(q.type==='numeric'){const raw=String(value??'').trim().replace(',','.');ok=raw!==''&&Number.isFinite(Number(raw))&&Math.abs(Number(raw)-Number(q.correct[0]))<=q.tolerance;}
 if(q.type==='multi')ok=Array.isArray(value)&&new Set(value).size===value.length&&value.length===q.correct.length&&q.correct.every(v=>value.includes(v));
 if(q.type==='matching')ok=!!value&&q.pairs.every(p=>value[p.id]===p.id);
 if(q.type==='ordering')ok=Array.isArray(value)&&value.length===q.items.length&&q.items.every((p,i)=>value[i]===p.id);
 return ok?q.points:0;
}
export function resultFor(attempt){let pending=0,score=0;const rows=attempt.snapshot.questions.map(q=>{const review=attempt.reviews?.[q.id];const points=q.type==='open'?(review?.score??null):objectiveScore(q,attempt.answers[q.id]);if(points===null)pending++;else score+=points;return {question:q,score:points,comment:review?.comment||''};});const max=rows.reduce((n,r)=>n+r.question.points,0);return {rows,pending,score,max,complete:pending===0,percent:pending===0&&max>0?Math.round(score/max*100):null};}
