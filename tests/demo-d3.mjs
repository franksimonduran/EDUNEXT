import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GUIDED_TOPICS,getGuidedTopic,getGuidedPrompt,getSuggestedPrompt,DEMO_CAPABILITIES} from '../frontend/js/demo/ai-guided.js';
import {DEMO_QUESTIONS,saveDemoResult,resetDemoResult} from '../frontend/js/demo/scenario.js';
import {DEMO_LANGUAGE_PAIRS,lookupDemoTranslation,getDemoVocabulary} from '../frontend/js/demo/translation.js';
import {listDemoPronunciation,demoPronunciationExercise,isSpeechDemoAvailable,speakDemoWord} from '../frontend/js/demo/pronunciation.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(root,'frontend');
const read=p=>fs.readFileSync(path.join(frontend,p),'utf8');
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};

assert.equal(GUIDED_TOPICS.length,5);
assert.ok(GUIDED_TOPICS.every(topic=>topic.prompts.length>0&&topic.prompts.every(p=>p.answer&&p.activity)));
assert.equal(getGuidedTopic('reading').title,'Comunicación');
assert.equal(getGuidedTopic('unknown'),null);
assert.equal(getGuidedPrompt('reading','main').question,'¿Cómo encuentro la idea principal de una lectura?');
assert.equal(getGuidedPrompt('reading','invented'),null);
assert.deepEqual(getSuggestedPrompt(),{topic:'reading',prompt:'main'});
const correct=DEMO_QUESTIONS.map(q=>q.correct);
const partial=correct.map((v,i)=>i<3?v:(v+1)%DEMO_QUESTIONS[i].choices.length);
saveDemoResult(partial);
assert.deepEqual(getSuggestedPrompt(),{topic:'reading',prompt:'feedback'});
resetDemoResult();
assert.equal(DEMO_CAPABILITIES.filter(c=>c.status==='disponible').length,3);
assert.ok(DEMO_CAPABILITIES.some(c=>c.name.includes('MiniCPM')&&c.status==='no certificado'));
assert.ok(DEMO_CAPABILITIES.some(c=>c.name.includes('Argos')&&c.status==='no activado'));
assert.ok(DEMO_CAPABILITIES.some(c=>c.name.includes('Análisis')&&c.status==='no activado'));

assert.equal(DEMO_LANGUAGE_PAIRS.length,2);
assert.equal(lookupDemoTranslation('Escuela','es','en').translation,'School');
assert.equal(lookupDemoTranslation('School','en','es').translation,'Escuela');
assert.equal(lookupDemoTranslation('palabra-inventada','es','en').status,'notFound');
assert.equal(lookupDemoTranslation('','es','en').status,'invalid');
assert.equal(lookupDemoTranslation('Escuela','es','fr').status,'invalid');
assert.ok(getDemoVocabulary('es','en').length>=10);

const items=listDemoPronunciation(5);
assert.ok(items.length>=4);
assert.ok(items.some(x=>x.word==='Family'));
assert.equal(demoPronunciationExercise('Family','Familia').matched,true);
assert.equal(demoPronunciationExercise('Family','Parque').matched,false);
assert.equal(demoPronunciationExercise('Missing','Familia').status,'invalid');
assert.equal(isSpeechDemoAvailable(null,null),false);
assert.equal(speakDemoWord('Family',{speech:null,Utterance:null}).status,'unsupported');
let spoken=null;
class MockUtterance{constructor(text){this.text=text;}}
const voice={cancel(){},speak(u){spoken=u;}};
assert.equal(speakDemoWord('Family',{speech:voice,Utterance:MockUtterance}).status,'requested');
assert.equal(spoken.text,'Family');
assert.equal(spoken.lang,'en-US');

const pages=[
 ['student/tutor-demo.html','tutor'],
 ['student/traductor-demo.html','translate'],
 ['student/pronuncia-demo.html','pronounce'],
 ['monitor/herramientas-ia-demo.html','monitor'],
 ['admin/herramientas-ia-demo.html','admin']
];
for(const [name,mode] of pages){
 const html=read(name);
 assert.ok(html.includes('data-d3-mode="'+mode+'"'),name+' indica modo D3');
 assert.ok(html.includes('id="d3-content"'),name+' tiene contenido');
 assert.ok(html.includes('../js/demo/ai-tools.js'),name+' usa módulo funcional');
 assert.ok(html.includes('../css/pages/demo-ai-d3.css'),name+' incluye responsive');
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const link=match[1].split('?')[0];
  if(!link||link.startsWith('#')||/^(https?:|data:)/.test(link))continue;
  const target=path.resolve(path.dirname(path.join(frontend,name)),decodeURIComponent(link));
  assert.ok(target.startsWith(frontend+path.sep)&&fs.existsSync(target),name+' enlace roto: '+link);
 }
}
assert.ok(read('demo.html').includes('student/tutor-demo.html'));
assert.ok(read('demo.html').includes('student/traductor-demo.html'));
assert.ok(read('demo.html').includes('student/pronuncia-demo.html'));
assert.ok(read('js/demo/activity.js').includes('prompt=feedback'));
for(const [old,newPage] of [['student/tutor.html','tutor-demo.html'],['student/traductor.html','traductor-demo.html'],['student/pronuncia.html','pronuncia-demo.html']]){
 assert.ok(read(old).includes(newPage),old+' sin acceso a demo guiada');
}
assert.ok(read('js/demo/dashboard-banner.js').includes('herramientas-ia-demo.html'));
assert.ok(!read('js/demo/ai-tools.js').includes('getUserMedia('),'No solicitar micrófono');
assert.ok(!read('js/demo/ai-tools.js').includes('fetch('),'No requerir servicios externos');
console.log('EDUNEXT D3: tutor pedagógico, diccionario, vocabulario, navegación y privacidad comprobados.');
