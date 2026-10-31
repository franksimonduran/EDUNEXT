function normalizeWord(value,policy={}) {
 let text=String(value??'').normalize('NFC');
 if(policy.trim)text=text.trim();
 if(policy.collapseWhitespace)text=text.replace(/\s+/gu,' ');
 if(policy.caseInsensitive)text=text.toLocaleLowerCase('es');
 if(policy.ignoreAccents)text=text.normalize('NFD').replace(/\p{M}/gu,'');
 return text;
}
export function validateAnswer(question,value) {
 if(['multiple','boolean','image'].includes(question.type)) {
  if(!question.options.some(option=>option.id===value))return {valid:false,correct:false};
  return {valid:true,correct:value===question.answer};
 }
 if(question.type==='word') {
  const word=normalizeWord(value,question.normalization);
  return {valid:word.length>0,correct:question.answer.some(answer=>normalizeWord(answer,question.normalization)===word)};
 }
 if(question.type==='numeric') {
  let text=String(value??'').trim();
  if(question.normalization?.decimalComma)text=text.replace(',','.');
  if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text))return {valid:false,correct:false};
  const number=Number(text);
  return {valid:Number.isFinite(number),correct:Math.abs(number-question.answer)<=(question.normalization?.tolerance??0)};
 }
 if(question.type==='matching') {
  const allowed=question.pairs.map(pair=>pair.id);
  const values=allowed.map(id=>value?.[id]);
  const valid=values.every(id=>allowed.includes(id))&&new Set(values).size===allowed.length;
  return {valid,correct:valid&&allowed.every(id=>value[id]===question.answer[id])};
 }
 if(question.type==='ordering') {
  const ids=question.items.map(item=>item.id);
  const valid=Array.isArray(value)&&value.length===ids.length&&new Set(value).size===ids.length&&value.every(id=>ids.includes(id));
  return {valid,correct:valid&&question.answer.every((id,index)=>id===value[index])};
 }
 return {valid:false,correct:false};
}
