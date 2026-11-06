import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEMO_QUESTIONS,calculateDemoResult,saveDemoResult,resetDemoResult,readDemoResult} from '../frontend/js/demo/scenario.js';
import {getDemoEvidence} from '../frontend/js/demo/metrics.js';
import {getSuggestedPrompt} from '../frontend/js/demo/ai-guided.js';
import {lookupDemoTranslation} from '../frontend/js/demo/translation.js';
import {listDemoPronunciation,demoPronunciationExercise} from '../frontend/js/demo/pronunciation.js';
import {DEMO_PACKAGES,DEMO_OFFLINE_CACHE,getDemoRequired} from '../frontend/js/demo/offline-packages.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(root,'frontend');
const page=p=>fs.readFileSync(path.join(frontend,p),'utf8');
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const right=DEMO_QUESTIONS.map(q=>q.correct);
for(const count of [0,3,4,5]){
 const answers=right.map((v,i)=>i<count?v:(v+1)%DEMO_QUESTIONS[i].choices.length);
 const expected=count*20;
 assert.equal(calculateDemoResult(answers).percent,expected);
 saveDemoResult(answers);
 const evidence=getDemoEvidence();
 assert.equal(evidence.points,expected);
 assert.equal(evidence.percent,expected);
 assert.equal(Boolean(evidence.achievement),expected>=80);
 assert.equal(getSuggestedPrompt().prompt,expected<80?'feedback':'main');
}
memory.set('unrelated','keep');
resetDemoResult();
assert.equal(readDemoResult(),null);
assert.equal(memory.get('unrelated'),'keep');
assert.equal(lookupDemoTranslation('Escuela','es','en').translation,'School');
assert.equal(lookupDemoTranslation('School','en','es').translation,'Escuela');
assert.equal(lookupDemoTranslation('desconocida-xyz','es','en').status,'notFound');
assert.ok(listDemoPronunciation().some(x=>x.word==='Family'));
assert.equal(demoPronunciationExercise('Family','Familia').matched,true);
assert.equal(DEMO_PACKAGES.length,5);
assert.equal(DEMO_OFFLINE_CACHE,'edunext-demo-offline-v2');
assert.ok(DEMO_PACKAGES.every(p=>getDemoRequired(p.id).length>0));
const routes=['demo.html','offline-demo.html','student/recorrido-demo.html',
 'student/progreso-demo.html','monitor/seguimiento-demo.html','admin/informe-demo.html',
 'student/tutor-demo.html','student/traductor-demo.html','student/pronuncia-demo.html',
 'monitor/herramientas-ia-demo.html','admin/herramientas-ia-demo.html',
 'student/index.html','monitor/index.html','admin/index.html'];
for(const route of routes){
 const html=page(route);
 assert.match(html,/<html\s+lang="es"/i);
 assert.match(html,/<main\b/i);
 assert.ok(html.includes('demo-polish-d5.css'));
}
for(const name of ['PRESENTACION_FINAL','GUIA_JURADO','MATRIZ_VALIDACION',
 'REPORTE_PRUEBAS','LIMITACIONES','ACTA_CIERRE_D6']){
 const doc=path.join(root,'docs/final-demo',name+'.md');
 assert.ok(fs.existsSync(doc),'Documento faltante: '+name);
}
assert.ok(page('demo.html').includes('DATOS FICTICIOS'));
assert.ok(page('offline-demo.html').includes('Preparar toda la demo'));
assert.ok(page('monitor/seguimiento-demo.html').includes('data-demo-role="monitor"'));
assert.ok(page('admin/informe-demo.html').includes('data-demo-role="admin"'));
console.log('D6 PASS: 4 escenarios, 14 páginas, 5 paquetes y 6 documentos.');
