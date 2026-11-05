import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {DEMO_PACKAGES,DEMO_OFFLINE_CACHE,getDemoPackage,getDemoRequired,getDemoResourceUrl,getDemoPackageStatus,isValidDemoResponse} from '../frontend/js/demo/offline-packages.js';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(project,'frontend');
assert.equal(DEMO_PACKAGES.length,5);
assert.equal(DEMO_OFFLINE_CACHE,'edunext-demo-offline-v1');
assert.equal(new Set(DEMO_PACKAGES.map(p=>p.id)).size,DEMO_PACKAGES.length);
const all=new Set();
for(const pkg of DEMO_PACKAGES){
 assert.ok(pkg.required.length>0,pkg.id+' tiene recursos');
 assert.ok(getDemoRequired(pkg.id).length>=pkg.required.length);
 for(const resource of pkg.required){
  const url=getDemoResourceUrl(resource);
  assert.equal(new URL(url).search,'');
  const target=path.resolve(frontend,decodeURIComponent(resource));
  assert.ok(target.startsWith(frontend+path.sep)&&fs.existsSync(target),pkg.id+' recurso inexistente: '+resource);
  all.add(resource);
 }
}
assert.ok(all.size>35,'debe cubrir portada, aprendizaje, idiomas, seguimiento y guías');
assert.equal(getDemoPackage('unknown'),null);
assert.throws(()=>getDemoResourceUrl('student/privado.html'));
assert.throws(()=>getDemoResourceUrl('../backend/.env'));
assert.throws(()=>getDemoResourceUrl('api/v1/users'));
assert.throws(()=>getDemoResourceUrl('https://another.example/x'));
const valid=new Response('contenido',{status:200,headers:{'Content-Type':'text/html','Cache-Control':'no-cache'}});
assert.equal(isValidDemoResponse(valid,'demo.html'),true);
assert.equal(isValidDemoResponse(new Response('secreto',{headers:{'Cache-Control':'private','Content-Type':'text/html'}}),'demo.html'),false);
assert.equal(isValidDemoResponse(new Response('secreto',{headers:{'Cache-Control':'no-store','Content-Type':'text/html'}}),'demo.html'),false);
assert.equal(isValidDemoResponse(new Response('error',{status:404,headers:{'Content-Type':'text/html'}}),'demo.html'),false);

const map=new Map();
globalThis.caches={open:async name=>{assert.equal(name,DEMO_OFFLINE_CACHE);return {match:async url=>map.get(url)?.clone()||undefined};}};
const base=getDemoRequired('base',{includeBase:false});
assert.equal((await getDemoPackageStatus('base')).ready,false);
function mediaType(p){
 if(p.endsWith('.html'))return 'text/html';
 if(p.endsWith('.css'))return 'text/css';
 if(p.endsWith('.js'))return 'text/javascript';
 if(p.endsWith('.webmanifest'))return 'application/manifest+json';
 if(p.endsWith('.svg'))return 'image/svg+xml';
 return 'image/png';
}
for(const resource of DEMO_PACKAGES[0].required){
 map.set(getDemoResourceUrl(resource),new Response('public static',{headers:{'Content-Type':mediaType(resource)}}));
}
assert.equal((await getDemoPackageStatus('base')).ready,true);
assert.equal((await getDemoPackageStatus('lectura')).ready,false);
assert.equal((await getDemoPackageStatus('lectura')).present,base.length);
map.delete(getDemoResourceUrl('demo.html'));
assert.equal((await getDemoPackageStatus('base')).status,'partial');

// Cargar el Service Worker real dentro de una VM, con scope GH Pages /EDUNEXT/.
const handlers={};
const origin='https://school.example';
const keys=new Map();
keys.set(origin+'/EDUNEXT/demo.html',new Response('Demo preparada',{headers:{'Content-Type':'text/html'}}));
keys.set(origin+'/EDUNEXT/student/recorrido-demo.html',new Response('Lectura preparada',{headers:{'Content-Type':'text/html'}}));
keys.set(origin+'/EDUNEXT/offline.html',new Response('<h1>Sin conexión</h1>',{headers:{'Content-Type':'text/html'}}));
const cacheFor=name=>({match:async(req,{ignoreSearch}={})=>{
 const key=typeof req==='string'?req:req.url;
 const clean=ignoreSearch?key.split('?')[0]:key;
 return ((name===DEMO_OFFLINE_CACHE||name==='aithron-static-v2')?keys.get(clean):null)?.clone();
}});
const context={
 self:{location:{href:origin+'/EDUNEXT/sw.js'},addEventListener:(name,handler)=>handlers[name]=handler,clients:{claim:async()=>{}}},
 location:{origin},URL,Response,Request,Promise,
 caches:{open:async name=>cacheFor(name)},
 fetch:async()=>{throw new TypeError('Network disabled');}
};
vm.runInNewContext(fs.readFileSync(path.join(frontend,'sw.js'),'utf8'),context);
async function offlineRequest(url,headers={Accept:'text/html'}){
 let result;
 handlers.fetch({request:new Request(origin+'/EDUNEXT/'+url,{headers}),respondWith:promise=>result=Promise.resolve(promise)});
 return result?await result:null;
}
const prepared=await offlineRequest('demo.html?modo=demo');
assert.equal(prepared.status,200);
assert.equal(await prepared.text(),'Demo preparada');
assert.equal(prepared.headers.get('X-EDUNEXT-Demo-Offline'),'prepared-public-only');
const lesson=await offlineRequest('student/recorrido-demo.html?modo=demo');
assert.equal(lesson.status,200);
assert.equal(await lesson.text(),'Lectura preparada');
assert.equal((await offlineRequest('student/index.html?modo=demo')).status,503,'no servir dashboard no preparado');
assert.equal(await offlineRequest('api/v1/student/progress'),null,'excluir API');
assert.equal(await offlineRequest('demo.html',{Accept:'text/html',Authorization:'Bearer SECRET'}),null,'excluir credenciales');
assert.equal((await offlineRequest('student/private.html')).status,503,'fallback para rutas no preparadas');
const source=fs.readFileSync(path.join(frontend,'sw.js'),'utf8');
assert.ok(!/caches\.delete\s*\(/.test(source),'no borrar cachés previas');
assert.ok(fs.readFileSync(path.join(frontend,'demo.html'),'utf8').includes('offline-demo.html'));
assert.ok(fs.readFileSync(path.join(frontend,'offline.html'),'utf8').includes('href="offline-demo.html"'));
console.log('EDUNEXT D4: inventario local, caché pública, ruta /EDUNEXT/, fallback y exclusión de API verificados.');
