// Traducción educativa D3: usa SOLO el diccionario ya incluido en EDUNEXT.
import {translateText} from '../services/translation.service.js';
import {dictionaryEntries} from '../data/dictionary-demo.data.js';
export const DEMO_LANGUAGE_PAIRS=Object.freeze([{from:'es',to:'en',label:'Español → Inglés'},{from:'en',to:'es',label:'Inglés → Español'}]);
export function lookupDemoTranslation(word,from='es',to='en'){
 if(typeof word!=='string'||word.length>120)return {status:'invalid',message:'Escribe una palabra o expresión de hasta 120 caracteres.'};
 const source=word.trim();
 if(!source)return {status:'invalid',message:'Selecciona o escribe una palabra del vocabulario.'};
 if(!DEMO_LANGUAGE_PAIRS.some(p=>p.from===from&&p.to===to))return {status:'invalid',message:'Este par de idiomas no está disponible en la demo.'};
 const result=translateText({text:source,from,to});
 if(result.status==='found')return {status:'found',word:result.entry.word,translation:result.entry.translation,example:result.entry.example,exampleTranslation:result.entry.exampleTranslation,topic:result.entry.topic??'Vocabulario general'};
 return {status:'notFound',message:'Esta palabra no aparece en el diccionario local. No se ofrece una traducción inventada.'};
}
export function getDemoVocabulary(from='es',to='en'){
 if(!DEMO_LANGUAGE_PAIRS.some(p=>p.from===from&&p.to===to))return [];
 return dictionaryEntries.filter(entry=>entry.from===from&&entry.to===to).map(entry=>({id:entry.id,word:entry.word,translation:entry.translation,topic:entry.topic??'General'}));
}
