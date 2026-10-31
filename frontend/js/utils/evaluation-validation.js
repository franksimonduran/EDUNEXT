export function validateAnswer(question, value){
 if(!question) return {ok:false};
 if(question.type==='open') return {ok:true};
 if(question.type==='word' || question.type==='numeric'){
  const v = String(value??'').trim().toLowerCase();
  if(!v) return {ok:false, empty:true};
  const correct = (question.correct||[]).map(x=>String(x).trim().toLowerCase());
  return {ok: correct.includes(v)};
 }
 if(question.type==='multiple' || question.type==='boolean' || question.type==='image'){
  if(!value) return {ok:false, empty:true};
  const correct = question.correct||[];
  return {ok: correct.includes(value)};
 }
 if(question.type==='matching'){
  if(!value || typeof value!=='object') return {ok:false, empty:true};
  // for demo just check all filled
  const pairs = question.pairs||[];
  const allFilled = pairs.every(p=>value[p.id]);
  return {ok: allFilled};
 }
 if(question.type==='ordering'){
  return {ok: Array.isArray(value) && value.length>0};
 }
 return {ok: !!value};
}

export function countAnswered(questions, answers){
 let n=0;
 for(const q of questions){
  const v = answers[q.id];
  if(q.type==='matching'){ if(v && typeof v==='object' && Object.keys(v).length) n++; continue; }
  if(q.type==='ordering'){ if(Array.isArray(v) && v.length) n++; continue; }
  if(String(v??'').trim()) n++;
 }
 return n;
}
