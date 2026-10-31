// Controlled source-level tests. VM is a Service Worker double, not a browser.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function workerCase(url,{headers={},responseHeaders={},offline=false,quota=false}={}){
 const handlers={},writes=[],lookups=[];
 const origin='https://school.example';
 const fallback=new Response('offline shell',{headers:{'Content-Type':'text/html'}});
 const cache={put:async(req)=>{if(quota)throw new DOMException('Full','QuotaExceededError');writes.push(typeof req==='string'?req:req.url);},addAll:async()=>{},match:async req=>{lookups.push(typeof req==='string'?req:req.url);return undefined;}};
 const context={URL,Response,Request,Promise,location:{origin},self:{location:{href:origin+'/sw.js'},addEventListener:(n,f)=>handlers[n]=f,clients:{claim:async()=>{}}},
 caches:{open:async()=>cache,match:async req=>{lookups.push(typeof req==='string'?req:req.url);return String(req).includes('offline.html')?fallback:undefined;}},
 fetch:async()=>{if(offline)throw new TypeError('Offline');return new Response('payload',{headers:responseHeaders});}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'frontend/sw.js'),'utf8'),context);
 let response;const pending=[];
 const request=new Request(origin+url,{headers});
 handlers.fetch({request,respondWith:p=>response=Promise.resolve(p),waitUntil:p=>pending.push(p)});
 const received=response?await response:undefined;
 await Promise.all(pending);await new Promise(r=>setImmediate(r));
 return {writes,lookups,handled:Boolean(response),status:received?.status};
}
(async()=>{
 let failed=0;
 async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}
 await check('SW does not cache private HTML',async()=>{
   const r=await workerCase('/student/index.html',{headers:{Accept:'text/html'},responseHeaders:{'Cache-Control':'private, no-store'}});assert.equal(r.writes.length,0);
 });
 await check('SW never looks up arbitrary private URLs offline',async()=>{
   const r=await workerCase('/private/child-photo.png',{offline:true});assert.equal(r.lookups.length,0);assert.equal(r.handled,false);
 });
 await check('SW excludes bearer resources',async()=>{
   const r=await workerCase('/assets/private.png',{headers:{Authorization:'Bearer fictional'}});assert.equal(r.writes.length,0);assert.equal(r.lookups.length,0);
 });
 await check('SW excludes no-store public-looking response',async()=>{
   const r=await workerCase('/assets/test.png',{responseHeaders:{'Cache-Control':'no-store'}});assert.equal(r.writes.length,0);
 });
 await check('SW excludes API',async()=>{
   const r=await workerCase('/api/v1/auth/me');assert.equal(r.handled,false);assert.equal(r.lookups.length,0);
 });
 await check('SW still caches public script',async()=>{
   const r=await workerCase('/js/core/config.js');assert.equal(r.writes.length,1);
 });
 await check('SW excludes cookie-varying public response',async()=>{
   const r=await workerCase('/assets/test.png',{responseHeaders:{Vary:'Cookie'}});assert.equal(r.writes.length,0);
 });
 await check('SW excludes query-bearing resources',async()=>{
   const r=await workerCase('/assets/test.png?student=fictional');assert.equal(r.handled,false);
 });
 await check('Cache quota failure preserves network success',async()=>{
   const r=await workerCase('/js/core/config.js',{quota:true});assert.equal(r.status,200);
 });
 if(failed)throw new Error(`${failed} security regression(s)`);
 console.log('PASS phase48 SW policy tests (VM only; no browser, database or tenant proof).');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
