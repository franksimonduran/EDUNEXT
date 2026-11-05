import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEMO_QUESTIONS,saveDemoResult,resetDemoResult} from '../frontend/js/demo/scenario.js';
import {DEMO_CONTEXT,getDemoEvidence,deriveDemoFeedback} from '../frontend/js/demo/metrics.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(root,'frontend');
const contentOf=relative=>fs.readFileSync(path.join(frontend,relative),'utf8');
const memory=new Map();
globalThis.localStorage={
 getItem:key=>memory.get(key)??null,
 setItem:(key,value)=>memory.set(key,value),
 removeItem:key=>memory.delete(key)
};
assert.equal(DEMO_CONTEXT.course,'Comunicación');
assert.equal(DEMO_CONTEXT.group,'5.º A');
assert.equal(getDemoEvidence().completed,false);
assert.equal(getDemoEvidence().percent,null);
assert.equal(getDemoEvidence().points,0);
const perfect=DEMO_QUESTIONS.map(q=>q.correct);
function resultWithCorrect(count){
 const chosen=perfect.map((correct,index)=>index<count?correct:(correct+1)%DEMO_QUESTIONS[index].choices.length);
 saveDemoResult(chosen);
 return getDemoEvidence();
}
assert.deepEqual([0,3,4,5].map(c=>resultWithCorrect(c).percent),[0,60,80,100]);
assert.equal(resultWithCorrect(4).points,80);
assert.equal(resultWithCorrect(4).achievement,'Lector del huerto');
assert.equal(resultWithCorrect(3).achievement,null);
assert.match(deriveDemoFeedback(resultWithCorrect(0)),/practicando/i);
assert.match(deriveDemoFeedback(resultWithCorrect(5)),/excelente/i);
memory.set('other-draft','preserve');
resetDemoResult();
assert.equal(getDemoEvidence().completed,false);
assert.equal(memory.get('other-draft'),'preserve');

const newPages={
 'student/progreso-demo.html':'student',
 'monitor/seguimiento-demo.html':'monitor',
 'admin/informe-demo.html':'admin'
};
for(const [page,role] of Object.entries(newPages)){
 const html=contentOf(page);
 assert.ok(html.includes('data-demo-role="'+role+'"'),page+' debe declarar perfil');
 assert.ok(html.includes('../js/demo/role-pages.js'),page+' debe enlazar lógica común');
 assert.ok(html.includes('../css/pages/demo-journeys-d2.css'),page+' debe enlazar estilos');
 assert.ok(html.includes('id="d2-content"'),page+' debe presentar contenido');
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const link=match[1];
  if(link.startsWith('#')||/^(?:https?:|data:)/.test(link))continue;
  const file=path.resolve(path.dirname(path.join(frontend,page)),decodeURIComponent(link.split('?')[0]));
  assert.ok(file.startsWith(frontend+path.sep),page+' no debe navegar fuera del frontend');
  assert.ok(fs.existsSync(file),page+' referencia inexistente: '+link);
 }
}
const attachments=[
 'student/progreso.html','student/logros.html',
 'monitor/detalle-estudiante.html','monitor/reportes.html',
 'admin/reportes.html','admin/estadisticas-institucionales.html'
];
for(const page of attachments){
 const html=contentOf(page);
 assert.ok(html.includes('../js/demo/context-panel.js'),page);
 assert.ok(html.includes('../css/pages/demo-journeys-d2.css'),page);
}
const banner=contentOf('js/demo/dashboard-banner.js');
assert.ok(banner.includes('progreso-demo.html'));
assert.ok(banner.includes('seguimiento-demo.html'));
assert.ok(banner.includes('informe-demo.html'));
const details=contentOf('js/demo/role-pages.js');
assert.ok(details.includes('d2-monitor-filter'),'Filtro de refuerzo debe ser funcional');
assert.ok(details.includes("filter==='support'"),'Filtro debe ocultar rendimientos que no requieran refuerzo');
assert.ok(details.includes('d2-admin-course'),'Debe existir filtro por curso');
assert.ok(details.includes("filter==='math'"),'No inventar datos para otras áreas');
assert.ok(contentOf('demo.html').includes('student/recorrido-demo.html'));
console.log('EDUNEXT DEMO D2: puntuación, progreso, filtros y enlaces verificados con datos sintéticos.');
