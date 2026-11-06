import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEMO_OFFLINE_CACHE,DEMO_PACKAGES,getDemoResourceUrl} from '../frontend/js/demo/offline-packages.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(root,'frontend');
const read=file=>fs.readFileSync(path.join(frontend,file),'utf8');
const routes=[
 'demo.html','offline-demo.html','student/recorrido-demo.html',
 'student/progreso-demo.html','monitor/seguimiento-demo.html','admin/informe-demo.html',
 'student/tutor-demo.html','student/traductor-demo.html','student/pronuncia-demo.html',
 'monitor/herramientas-ia-demo.html','admin/herramientas-ia-demo.html',
 'student/index.html','monitor/index.html','admin/index.html'
];
assert.equal(DEMO_OFFLINE_CACHE,'edunext-demo-offline-v2','se debe versionar la caché para los estilos D5');
assert.ok(DEMO_PACKAGES.find(x=>x.id==='base')?.required.includes('css/pages/demo-polish-d5.css'));
assert.match(getDemoResourceUrl('css/pages/demo-polish-d5.css'),/demo-polish-d5\.css$/);
const css=read('css/pages/demo-polish-d5.css');
assert.ok(css.includes('prefers-reduced-motion'),'respetar reducción de movimiento');
assert.ok(css.includes(':focus-visible'),'proporcionar foco visible');
assert.ok(css.includes('max-width:360px'),'incluir teléfonos pequeños');
const service=read('sw.js');
assert.ok(service.includes("const DEMO_CACHE='edunext-demo-offline-v2'"));
assert.doesNotMatch(service,/caches\.delete\s*\(/,'conservar cachés preexistentes');
for(const route of routes){
 const html=read(route);
 assert.match(html,/<html\s+lang="es"/i,route+' debe declarar idioma');
 assert.match(html,/<main\b/i,route+' debe tener región principal');
 assert.match(html,/<h1\b/i,route+' debe tener encabezado principal');
 assert.ok(html.includes('demo-polish-d5.css'),route+' debe cargar diseño compartido');
 const matches=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>/g)];
 assert.ok(matches.length>0&&matches.at(-1)[1].includes('demo-polish-d5.css'),route+' debe aplicar D5 después de su CSS');
 const skip=html.match(/<a\s+class="(?:skip|skip-link)"\s+href="#([^"]+)"/);
 assert.ok(skip,route+' debe ofrecer salto por teclado');
 assert.ok(html.includes('id="'+skip[1]+'"'),route+' destino de salto inexistente: '+skip[1]);
 for(const match of html.matchAll(/<(?:link|script)\s[^>]*(?:src|href)="([^"]+)"/g)){
  const resource=match[1].split(/[?#]/)[0];
  if(!resource||/^(?:https?:|data:|#)/.test(resource))continue;
  const filename=path.resolve(frontend,path.dirname(route),decodeURIComponent(resource));
  assert.ok(filename.startsWith(frontend+path.sep)&&fs.existsSync(filename),route+' recurso ausente: '+resource);
 }
}
const practice=read('js/demo/activity.js');
assert.ok(practice.includes('tabindex="-1"'),'el título de cada pregunta debe poder recibir foco');
assert.ok(practice.includes("root.querySelector('#quiz-title')?.focus()"),'el foco debe recuperarse al cambiar preguntas');
assert.ok(practice.includes('progreso-demo.html'),'resultados deben abrir la página de progreso');
const ai=read('js/demo/ai-tools.js');
assert.ok(ai.includes("event.key==='Enter'"),'traductor debe admitir teclado');
assert.ok(read('demo.html').includes('id="principal"'),'portada debe tener landmark destino');
assert.ok(read('demo.html').includes('funcionamiento offline del sistema académico completo'),'la advertencia debe distinguir el alcance D4');
console.log('EDUNEXT D5: 14 pantallas, navegación accesible y caché v2 verificados.');
