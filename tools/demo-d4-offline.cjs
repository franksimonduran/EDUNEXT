const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {createDemoServer}=require('./demo-server.cjs');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function run(){
 const server=createDemoServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const binary=process.env.DEMO_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(x=>fs.existsSync(x));
 if(!binary){server.close();throw new Error('Chrome no disponible. Configura DEMO_BROWSER.');}
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'edunext-d4-'));
 const args=['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
 if(process.platform==='linux'&&(process.env.CI==='true'||process.env.GITHUB_ACTIONS==='true'))args.push('--no-sandbox','--disable-dev-shm-usage');
 const browser=spawn(binary,args,{stdio:['ignore','ignore','pipe']});
 let stderr='',socket=null,cmdId=0,current=null;
 const pending=new Map(),problems=[],checks=[];
 browser.stderr?.on('data',chunk=>stderr=(stderr+chunk).slice(-3000));
 try{
  let port=null;
  for(let i=0;i<300;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await delay(100);}}
  if(!port)throw new Error('Chrome CDP no iniciado: '+stderr);
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=event=>{
   const m=JSON.parse(event.data);
   if(m.id){const p=pending.get(m.id);if(!p)return;clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);return;}
   if(current&&m.method==='Runtime.exceptionThrown')current.errors.push(m.params.exceptionDetails.text+': '+(m.params.exceptionDetails.exception?.description||''));
   if(current&&m.method==='Network.responseReceived'&&m.params.response.status>=400)current.http.push({code:m.params.response.status,url:m.params.response.url});
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++cmdId;
   pending.set(id,{resolve,reject,timer:setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method));},25000)});
   socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
   const v=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
   if(v.exceptionDetails)throw new Error(v.exceptionDetails.exception?.description||'Error de evaluación');
   return v.result.value;
  };
  const eventually=async(expression,attempts=180)=>{
   let last;
   for(let i=0;i<attempts;i++){
    last=await evaluate(expression);
    if(last)return last;
    await delay(180);
   }
   throw new Error('No se cumplió la condición: '+expression.slice(0,120)+' (último valor: '+String(last)+')');
  };
  const visit=async(route,selector)=>{
   current={route,errors:[],http:[]};checks.push(current);
   await send('Page.navigate',{url:base+route});
   await eventually('document.readyState==="complete" && !!document.querySelector('+JSON.stringify(selector)+')');
   await delay(250);
   const shape=await evaluate('JSON.stringify({title:document.title,text:document.body.innerText.length,overflow:document.documentElement.scrollWidth>innerWidth+1})');
   Object.assign(current,JSON.parse(shape));
   assert.ok(current.text>120,'Vista sin contenido: '+route);
   assert.equal(current.overflow,false,'Desbordamiento: '+route);
   assert.equal(current.errors.length,0,'Excepciones JS: '+route+': '+JSON.stringify(current.errors));
   return current;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:920,deviceScaleFactor:1,mobile:false});
  await visit('offline-demo.html','.package-card');
  assert.equal(await evaluate('document.querySelectorAll(".package-card").length'),5);
  await evaluate('document.querySelector("#offline-prepare-all").click();true');
  const outcome=await eventually('(()=>{const el=document.querySelector("#offline-action-status");return el?.dataset.kind==="success"?"success":el?.dataset.kind==="error"?el.textContent:false})()',400);
  assert.equal(outcome,'success','Preparación fallida: '+outcome);
  assert.equal(await evaluate('document.querySelector("#offline-summary").textContent.trim()'),'5 / 5 paquetes');
  assert.ok(await eventually('Boolean(navigator.serviceWorker.controller)',100),'SW sin control');
  // No permitir que HTTP cache del navegador simule una prueba offline.
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await visit('offline-demo.html','.package-card');
  assert.equal(await evaluate('document.querySelector("#offline-summary").textContent.trim()'),'5 / 5 paquetes');
  const fromSW=await evaluate('(async()=>{const r=await fetch("demo.html",{headers:{Accept:"text/html"}});return r.headers.get("X-EDUNEXT-Demo-Offline")})()');
  assert.equal(fromSW,'prepared-public-only','La navegación offline debe provenir del SW preparado');
  for(const width of [360,1280]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:920,deviceScaleFactor:1,mobile:false});
   await visit('offline-demo.html','.package-card');
   await visit('demo.html','.profiles');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:920,deviceScaleFactor:1,mobile:false});
  await visit('student/recorrido-demo.html?modo=demo','#demo-activity input[name="answer"]');
  const answer=await evaluate(`(()=>{
   for(const value of [1,0,2,1,0]){
    const radio=document.querySelector('#demo-activity input[name="answer"][value="'+value+'"]');
    if(!radio)return 'missing-radio';
    radio.checked=true;
    radio.dispatchEvent(new Event('change',{bubbles:true}));
    const next=document.querySelector('#demo-activity button[data-action="next"]');
    if(!next||next.disabled)return 'next-disabled';
    next.click();
   }
   return document.querySelector('.result-score strong')?.textContent||'no-result';
  })()`);
  assert.equal(answer,'100%','La práctica debe producir 100 % offline');
  await visit('student/progreso-demo.html?modo=demo','#d2-content');
  assert.ok((await evaluate('document.querySelector("#d2-content").innerText')).includes('100 %'),'Progreso del estudiante perdido');
  await visit('monitor/seguimiento-demo.html?modo=demo','#d2-monitor-rows');
  assert.ok((await evaluate('document.querySelector("#d2-monitor-rows").innerText')).includes('100 %'),'Monitor sin resultado');
  await visit('admin/informe-demo.html?modo=demo','#d2-admin-rows');
  assert.ok((await evaluate('document.querySelector("#d2-admin-rows").innerText')).includes('100 %'),'Administrador sin resultado');
  await visit('student/tutor-demo.html?modo=demo','#d3-answer');
  assert.equal(await evaluate('(()=>{document.querySelector("#d3-answer").click();return Boolean(document.querySelector(".d3-answer"))})()'),true);
  await visit('student/traductor-demo.html?modo=demo','#d3-translate');
  assert.equal(await evaluate('(()=>{document.querySelector("#d3-search").value="Escuela";document.querySelector("#d3-translate").click();return document.querySelector("#d3-translation-result").innerText.includes("School")})()'),true);
  await visit('student/pronuncia-demo.html?modo=demo','#d3-check-meaning');
  assert.equal(await evaluate('(()=>{document.querySelector("#d3-meaning").value="Familia";document.querySelector("#d3-check-meaning").click();return Boolean(document.querySelector("#d3-pron-result [data-kind=good]"))})()'),true);
  // A prepared app cannot silently convert an authenticated API route into cached HTML.
  const protectedStatus=await evaluate('(async()=>{try{const r=await fetch("api/v1/demo-private",{headers:{Authorization:"Bearer synthetic"}});return r.status}catch{return "offline-error"}})()');
  assert.equal(protectedStatus,'offline-error','Las APIs no deben responder con páginas de caché');
  console.log(JSON.stringify({phase:'EDUNEXT D4',offline:true,packages:5,checks:checks.length,result:'PASS',protectedStatus},null,2));
 }catch(error){console.error('D4 FAILED: '+error.stack);console.error('Checks:',JSON.stringify(checks.slice(-8),null,2));process.exitCode=1;}
 finally{if(socket)socket.close();browser.kill();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
