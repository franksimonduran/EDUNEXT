// Conservative lexical routing only. No inference, network or fallback to the previous topic.
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const ignored=new Set('a al de del el la las los un una unos unas y o en con por para que es son se como cual cuales quiero saber aprender explica explicame sobre ayudame ayuda tema hola favor puedes puede ejemplo ejemplos'.split(' '));
const aliases=[['acentuacion','acento','acentos','tilde','tildes','tonica'],['fraccion','fracciones','fraccionario'],['decimal','decimales'],['multiplicacion','multiplicar'],['division','dividir'],['suma','sumar'],['resta','restar']];
const terms=value=>[...new Set(normalize(value).match(/[a-z0-9]+/g)??[])].filter(t=>t.length>2&&!ignored.has(t));
function matches(term,tokens){
 const group=aliases.find(g=>g.includes(term));
 return tokens.some(token=>token===term||(group?.includes(token))||(term.length>=5&&token.length>=5&&term.slice(0,5)===token.slice(0,5)));
}
export function selectLocalTopic(question,materials){
 const query=terms(question);
 if(!query.length)return {kind:'missing',candidates:[]};
 const ranked=materials.map((material,index)=>{
  const title=terms(material.title),body=terms(material.explanation);
  const hits=query.filter(term=>matches(term,[...title,...body]));
  const score=hits.length/query.length+query.filter(term=>matches(term,title)).length*2;
  return {index,score,coverage:hits.length/query.length};
 }).filter(item=>item.coverage>=.5).sort((a,b)=>b.score-a.score);
 if(!ranked.length)return {kind:'missing',candidates:[]};
 const candidates=ranked.filter(item=>ranked[0].score-item.score<.5).map(item=>item.index);
 return candidates.length===1?{kind:'match',index:candidates[0],candidates}:{kind:'ambiguous',candidates};
}
