// Práctica de pronunciación sin grabación, puntuación de voz ni red.
import {getPronunciationItems} from '../data/pronunciation-demo.data.js';
export function listDemoPronunciation(grade=5){return getPronunciationItems({grade,lang:'en'}).map(({id,word,translation,example,topic})=>({id,word,translation,example,topic}));}
export function isSpeechDemoAvailable(speech=globalThis.speechSynthesis,utterance=globalThis.SpeechSynthesisUtterance){
 return Boolean(speech&&typeof speech.speak==='function'&&typeof utterance==='function');
}
export function speakDemoWord(word,{speech=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
 if(!isSpeechDemoAvailable(speech,Utterance))return {status:'unsupported'};
 const item=listDemoPronunciation().find(x=>x.word===word);
 if(!item)return {status:'unknown'};
 try{
  speech.cancel();
  const u=new Utterance(item.word);
  u.lang='en-US';u.rate=.85;u.pitch=1;
  speech.speak(u);
  return {status:'requested'};
 }catch{return {status:'unavailable'};}
}
export function demoPronunciationExercise(word,meaning){
 const item=listDemoPronunciation().find(x=>x.word===word);
 if(!item||typeof meaning!=='string')return {status:'invalid'};
 return {status:'checked',matched:item.translation.toLocaleLowerCase('es')===meaning.trim().toLocaleLowerCase('es'),note:'Se comprobó el significado escrito. No se evaluó tu voz.'};
}
