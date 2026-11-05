import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEMO_QUESTIONS,DEMO_STUDENT,calculateDemoResult,readDemoResult,saveDemoResult,resetDemoResult} from '../frontend/js/demo/scenario.js';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=file=>fs.readFileSync(path.join(repo,'frontend',file),'utf8');
const source=file=>fs.readFileSync(path.join(repo,file),'utf8');
const memory=new Map();
globalThis.localStorage={
 getItem:key=>memory.get(key)??null,
 setItem:(key,val)=>memory.set(key,val),
 removeItem:key=>memory.delete(key)
};
assert.equal(DEMO_STUDENT.grade,5);
assert.equal(DEMO_QUESTIONS.length,5);
assert.equal(readDemoResult(),null);
assert.throws(()=>calculateDemoResult([0,1]),TypeError);
assert.throws(()=>calculateDemoResult([0,0,0,0,100]),TypeError);
const correct=DEMO_QUESTIONS.map(question=>question.correct);
assert.equal(calculateDemoResult(correct).percent,100);
const stored=saveDemoResult(correct);
assert.equal(stored.persisted,true);
assert.equal(stored.percent,100);
assert.equal(readDemoResult().correct,5);
const partial=correct.map((item,i)=>i===0?((item+1)%DEMO_QUESTIONS[i].choices.length):item);
assert.equal(saveDemoResult(partial).percent,80);
assert.equal(readDemoResult().percent,80);
assert.equal(memory.size,1);
memory.set('unrelated-private-draft','do-not-touch');
resetDemoResult();
assert.equal(readDemoResult(),null);
assert.equal(memory.get('unrelated-private-draft'),'do-not-touch');
assert.equal(memory.size,1);
for(const [role,expected] of [['student','../js/demo/dashboard-banner.js'],['monitor','../js/demo/dashboard-banner.js'],['admin','../js/demo/dashboard-banner.js']]){
 const doc=html(role+'/index.html');
 assert.ok(doc.includes(expected),role+' debe importar el panel común');
 assert.ok(doc.includes('../css/pages/demo-dashboard.css'),role+' debe importar su estilo');
}
assert.ok(html('demo.html').includes('student/recorrido-demo.html?modo=demo'),'portada debe enlazar el recorrido');
assert.ok(html('demo.html').includes('id="demo-reset"'),'portada debe permitir reiniciar resultado ficticio');
assert.ok(html('student/recorrido-demo.html').includes('id="demo-activity"'),'recorrido debe contener cuestionario');
assert.ok(source('frontend/js/demo/dashboard-banner.js').includes('readDemoResult'),'los tres roles deben mostrar el resultado compartido');
assert.ok(fs.existsSync(path.join(repo,'frontend/css/pages/demo-story.css')));
assert.ok(fs.existsSync(path.join(repo,'frontend/css/pages/demo.css')));
console.log('EDUNEXT DEMO: escenario, resultados y enlaces de tres perfiles verificados.');
