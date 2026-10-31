const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const origin='https://school.example';
function response(body,{status=200,headers={}}={}){return new Response(body,{status,headers});}
function strip(url){const u=new URL(url);return u.origin+u.pathname;}
function createCache(entries,writes,quota){
 return {
  async put(req,res){if(quota)throw new DOMException('Full','QuotaExceededError');const key=typeof req==='string'?req:req.url;entries.set(key,res.clone());writes.push(key);},
  async match(req,options={}){const key=typeof req==='string'?req:req.url;let value=entries.get(key);if(!value&&options.ignoreSearch){for(const [candidate,item] of entries)if(strip(candidate)===strip(key)){value=item;break;}}return value?.clone();},
  async addAll(urls){for(const url of urls)entries.set(url,await fetch(url));},
  async keys(){return [...entries.keys()];}
 };
}
async function workerCase({url,headers={},offline=false,prepared={},publicCache={},staticCache={},quota=false,cacheFailure=false,network={}}={}){
 const handlers={},writes={prepared:[],public:[],static:[]},lookups={'aithron-monitor-shell-v1':[],'aithron-public-v2':[],'aithron-static-v2':[]};
 const stores={
  'aithron-monitor-shell-v1':createCache(new Map(Object.entries(prepared)),writes.prepared,quota),
  'aithron-public-v2':createCache(new Map(Object.entries(publicCache)),writes.public,quota),
  'aithron-static-v2':createCache(new Map(Object.entries(staticCache)),writes.static,false)
 };
 const context={
  URL,Response,Request,Promise,location:{origin},
  self:{location:{href:origin+'/sw.js'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}}},
  caches:{
   open:async name=>{if(cacheFailure)throw new Error('cache unavailable');const store=stores[name];lookups[name]?.push(url);return store;},
   match:async req=>{for(const [name,store] of Object.entries(stores)){const hit=await store.match(req);if(hit)return hit;}return undefined;}
  },
  fetch:async req=>{if(offline)throw new TypeError('Offline');const key=typeof req==='string'?req:req.url;const value=network[key]||network[strip(key)];if(value instanceof Error)throw value;return value?value.clone():response('network payload',{headers:{'Content-Type':'application/octet-stream'}});}
 };
 vm.runInNewContext(fs.readFileSync(path.join(root,'frontend/sw.js'),'utf8'),context);
 let responsePromise;const pending=[];
 handlers.fetch({request:new Request(origin+url,{headers}),respondWith:value=>responsePromise=Promise.resolve(value),waitUntil:value=>pending.push(value)});
 const received=responsePromise?await responsePromise:undefined;
 await Promise.all(pending);
 return {received,handled:Boolean(responsePromise),writes,lookups};
}
(async()=>{
 let failed=0;
 async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+': '+error.message);}}
 const html=body=>response(body,{headers:{'Content-Type':'text/html;charset=utf-8','Content-Security-Policy':"default-src 'self'"}});
 const asset=body=>response(body,{headers:{'Content-Type':'application/javascript'}});
 await check('prepared monitor HTML is served offline with marker and CSP',async()=>{
  const r=await workerCase({url:'/monitor/evaluaciones.html',headers:{Accept:'text/html'},offline:true,prepared:{[origin+'/monitor/evaluaciones.html']:html('monitor shell')}});
  assert.equal(r.received.status,200);assert.equal(r.received.headers.get('X-EDUNEXT-Offline'),'prepared');assert.equal(r.received.headers.get('Content-Security-Policy'),"default-src 'self'");assert.equal(await r.received.text(),'monitor shell');
 });
 await check('prepared admin HTML is served offline',async()=>{
  const r=await workerCase({url:'/admin/institucion.html',headers:{Accept:'text/html'},offline:true,prepared:{[origin+'/admin/institucion.html']:html('admin shell')}});
  assert.equal(r.received.status,200);assert.equal(r.received.headers.get('X-EDUNEXT-Offline'),'prepared');
 });
 await check('prepared student lesson with query is served offline',async()=>{
  const url=origin+'/student/leccion.html?grade=5&course=math&unit=u1&lesson=l1';
  const r=await workerCase({url:'/student/leccion.html?grade=5&course=math&unit=u1&lesson=l1',headers:{Accept:'text/html'},offline:true,prepared:{[url]:html('lesson shell')}});
  assert.equal(r.received.status,200);assert.equal(r.received.headers.get('X-EDUNEXT-Offline'),'prepared');assert.equal(await r.received.text(),'lesson shell');
 });
 await check('ignoreSearch serves the same prepared student shell',async()=>{
  const url=origin+'/student/leccion.html?grade=5&course=math&unit=u1&lesson=l1';
  const r=await workerCase({url:'/student/leccion.html?grade=6&course=other',headers:{Accept:'text/html'},offline:true,prepared:{[url]:html('lesson shell')}});
  assert.equal(r.received.status,200);assert.equal(r.received.headers.get('X-EDUNEXT-Offline'),'prepared');
 });
 await check('unprepared student index does not consult prepared cache',async()=>{
  const r=await workerCase({url:'/student/index.html',headers:{Accept:'text/html'},offline:true,prepared:{[origin+'/student/index.html']:html('must not serve')},staticCache:{[origin+'/offline.html']:html('offline shell')}});
  assert.equal(r.received.status,503);assert.equal(r.received.headers.get('X-Aithron-Offline-Fallback'),'1');assert.equal(r.lookups['aithron-monitor-shell-v1'].length,0);assert.equal(await r.received.text(),'offline shell');
 });
 await check('prepared HTML allowlist rejects other student pages',async()=>{
  const r=await workerCase({url:'/student/descargas.html',headers:{Accept:'text/html'},offline:true,prepared:{[origin+'/student/descargas.html']:html('must not serve')},staticCache:{[origin+'/offline.html']:html('offline shell')}});
  assert.equal(r.received.status,503);assert.equal(r.lookups['aithron-monitor-shell-v1'].length,0);
 });
 await check('prepared public asset is served offline',async()=>{
  const r=await workerCase({url:'/js/student/lessons.js',offline:true,prepared:{[origin+'/js/student/lessons.js']:asset('export const x=1;')}});
  assert.equal(r.received.status,200);assert.equal(r.received.headers.get('X-EDUNEXT-Offline'),'prepared');assert.equal(await r.received.text(),'export const x=1;');
 });
 await check('public cache asset is served offline',async()=>{
  const r=await workerCase({url:'/js/core/config.js',offline:true,publicCache:{[origin+'/js/core/config.js']:asset('export const config=1;')}});
  assert.equal(r.received.status,200);assert.equal(await r.received.text(),'export const config=1;');
 });
 await check('private asset offline is not handled',async()=>{
  const r=await workerCase({url:'/private/child-photo.png',offline:true,prepared:{[origin+'/private/child-photo.png']:html('private')}});
  assert.equal(r.handled,false);assert.equal(r.lookups['aithron-monitor-shell-v1'].length,0);
 });
 await check('API request is not handled',async()=>{
  const r=await workerCase({url:'/api/v1/auth/me'});assert.equal(r.handled,false);
 });
 await check('bearer request is not handled',async()=>{
  const r=await workerCase({url:'/assets/private.png',headers:{Authorization:'Bearer fictional'}});assert.equal(r.handled,false);
 });
 await check('no-store public response is not cached',async()=>{
  const r=await workerCase({url:'/assets/test.png',network:{[origin+'/assets/test.png']:response('payload',{headers:{'Content-Type':'image/png','Cache-Control':'no-store'}})}});
  assert.equal(r.received.status,200);assert.equal(r.writes.public.length,0);
 });
 await check('quota failure preserves network success',async()=>{
  const r=await workerCase({url:'/js/core/config.js',quota:true});assert.equal(r.received.status,200);
 });
 await check('cache failure still returns offline fallback',async()=>{
  const r=await workerCase({url:'/monitor/evaluaciones.html',headers:{Accept:'text/html'},offline:true,cacheFailure:true});
  assert.equal(r.received.status,503);assert.equal(r.received.headers.get('Content-Type'),'text/plain;charset=utf-8');
 });
 await check('query-bearing public assets stay unhandled',async()=>{
  const r=await workerCase({url:'/assets/test.png?student=fictional'});assert.equal(r.handled,false);
 });
 if(failed)throw new Error(`${failed} offline/PWA regression(s)`);
 console.log('PASS offline/PWA VM tests (no browser, database or tenant proof).');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
