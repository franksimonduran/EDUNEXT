'use strict';
const assert=require('node:assert/strict');
const {createDemoServer}=require('../tools/demo-server.cjs');
const {createLocalPreviewHandler}=require('../tools/local-ai-preview.cjs');

async function launch({available=()=>true,translate=async()=> 'Water is important.'}={}){
 let server;
 server=createDemoServer({handler:createLocalPreviewHandler({
  getOrigin:()=> 'http://127.0.0.1:'+server.address().port,
  available,translate
 })});
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',error=>error?reject(error):resolve()));
 const base='http://127.0.0.1:'+server.address().port;
 return {server,base,close:()=>new Promise(resolve=>server.close(resolve))};
}
async function run(){
 const app=await launch();
 try{
  const status=await fetch(app.base+'/__edunext_local/status');
  assert.equal(status.status,200);
  assert.equal(status.headers.get('cache-control'),'private, no-store');
  const capability=await status.json();
  assert.equal(capability.mode,'local_preview');
  assert.equal(capability.available,true);
  assert.match(capability.token,/^[0-9a-f]{64}$/);
  const api=app.base+'/__edunext_local/translate';
  const options={
   method:'POST',
   headers:{'Content-Type':'application/json','X-EDUNEXT-Preview-Token':capability.token},
   body:JSON.stringify({text:'El agua es importante.',source_language:'es',target_language:'en'})
  };
  assert.equal((await fetch(api,{...options,headers:{'Content-Type':'application/json'}})).status,403);
  assert.equal((await fetch(api,{...options,headers:{...options.headers,Origin:'https://example.org'}})).status,403);
  assert.equal((await fetch(api,{...options,body:JSON.stringify({text:'test@example.com',source_language:'es',target_language:'en'})})).status,400);
  assert.equal((await fetch(api,{...options,body:JSON.stringify({text:'Hola',source_language:'es',target_language:'es'})})).status,400);
  const good=await fetch(api,options);
  assert.equal(good.status,200);
  assert.equal((await good.json()).text,'Water is important.');
  assert.equal((await fetch(app.base+'/student/traductor.html?modo=local')).status,200);
  assert.equal((await fetch(app.base+'/student/tutor.html?modo=local')).status,200);
 }finally{await app.close();}
 let release,notify;
 const begun=new Promise(resolve=>notify=resolve);
 const blocking=await launch({translate:()=>{notify();return new Promise(resolve=>release=resolve);}});
 try{
  const s=await (await fetch(blocking.base+'/__edunext_local/status')).json();
  const target=blocking.base+'/__edunext_local/translate';
  const request={method:'POST',headers:{'Content-Type':'application/json','X-EDUNEXT-Preview-Token':s.token},
   body:JSON.stringify({text:'hola',source_language:'es',target_language:'en'})};
  const first=fetch(target,request);
  await begun;
  assert.equal((await fetch(target,request)).status,429);
  release('hello');
  const done=await first;
  assert.equal(done.status,200);
 }finally{if(release)release('hello');await blocking.close();}
 const unavailable=await launch({available:()=>false});
 try{
  const s=await (await fetch(unavailable.base+'/__edunext_local/status')).json();
  assert.equal(s.available,false);assert.equal(s.token,null);
  const res=await fetch(unavailable.base+'/__edunext_local/translate',{method:'POST'});
  assert.equal(res.status,503);
 }finally{await unavailable.close();}
 console.log('EDUNEXT local Argos preview: loopback, origin, ephemeral token, input bounds, single inference, static tutor and no-model cases OK (synthetic translator).');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
