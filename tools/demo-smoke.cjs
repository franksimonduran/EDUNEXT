const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const {createDemoServer}=require('./demo-server.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const server=createDemoServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/`;
 const executable=process.env.DEMO_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
 if(!executable){server.close();throw new Error('No se encontró Edge/Chrome. Configura DEMO_BROWSER.');}
 const profile=fs.mkdtempSync(path.join(process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'Temp/opencode'):os.tmpdir(),'edunext-demo-'));
 const chromeArgs=['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'];
 // CI runs in a disposable Linux container without a usable Chrome sandbox.
 if(process.platform==='linux'&&process.env.CI==='true')chromeArgs.push('--no-sandbox','--disable-dev-shm-usage');
 const browser=spawn(executable,chromeArgs,{stdio:['ignore','ignore','pipe']});
 let browserStderr='';
 browser.stderr?.on('data',part=>{browserStderr=(browserStderr+String(part)).slice(-4000);});
 let socket;const results=[];
 try{
  let port;for(let n=0;n<100;n++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await delay(100);}}
  if(!port)throw new Error('CDP no inició'+(browserStderr?': '+browserStderr:''));
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let id=0,current;const pending=new Map();
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}}else if(current){if(m.method==='Runtime.exceptionThrown')current.errors.push(m.params.exceptionDetails.text+': '+(m.params.exceptionDetails.exception?.description||''));if(m.method==='Network.responseReceived'&&m.params.response.status>=400)current.http.push({status:m.params.response.status,url:m.params.response.url});}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject,timer:setTimeout(()=>{pending.delete(key);reject(new Error(`CDP timeout: ${method}`));},15000)});socket.send(JSON.stringify({id:key,method,params}));});
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  const landing=fs.readFileSync(path.join(__dirname,'../frontend/demo.html'),'utf8');
  const routes=['demo.html',...new Set([...landing.matchAll(/href="((?:student|monitor|admin)\/[^"#]+)"/g)].map(m=>m[1]))];
  for(const width of [360,1280]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   for(const route of routes){
    current={route,width,errors:[],http:[]};results.push(current);
    await send('Page.navigate',{url:base+route});
    for(let n=0;n<50;n++){await delay(100);const r=await send('Runtime.evaluate',{expression:`location.href===${JSON.stringify(base+route)} && document.readyState==='complete'`,returnByValue:true});if(r.result.value)break;}
    for(let n=0;n<100;n++){await delay(100);const ready=await send('Runtime.evaluate',{expression:"document.body.innerText.length>100 && !document.querySelector('[aria-busy=\"true\"]')",returnByValue:true});if(ready.result.value)break;}
    const r=await send('Runtime.evaluate',{expression:'JSON.stringify({title:document.title,overflow:document.documentElement.scrollWidth>innerWidth+1,text:document.body.innerText.length})',returnByValue:true});
    Object.assign(current,JSON.parse(r.result.value));
   }
  }
  const actions=[];
  for(const [source,selector,expected] of [
   ['monitor/index.html?modo=demo','[data-module="insights"]','monitor/analisis-resultados.html'],
   ['monitor/aulas.html?modo=demo','[data-section="insights"]','monitor/analisis-resultados.html'],
   ['monitor/aulas.html?modo=demo','[data-section="sync"]','monitor/privacidad.html'],
   ['monitor/aulas.html?modo=demo','[data-section="calendar"]','monitor/calendario.html'],
   ['monitor/detalle-estudiante.html?id=a5-s5&modo=demo','button[data-future]','monitor/refuerzos.html'],
   ['monitor/seguimiento-aula.html?id=a5&modo=demo','button[data-future]','monitor/crear-refuerzo.html']
  ]){
   current={route:source+' click '+selector,width:1280,errors:[],http:[]};
   await send('Page.navigate',{url:base+source});
   let clicked=false;
   for(let n=0;n<100;n++){await delay(100);const check=await send('Runtime.evaluate',{expression:`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b)return false;b.click();return true;})()`,returnByValue:true});if(check.result.value){clicked=true;break;}}
   let destination='';for(let n=0;n<100&&clicked;n++){await delay(100);const check=await send('Runtime.evaluate',{expression:'location.href',returnByValue:true});destination=check.result.value;if(destination.startsWith(base+expected))break;}
   await delay(500);
   actions.push({...current,clicked,destination,passed:clicked&&destination.startsWith(base+expected)&&!current.errors.length&&!current.http.length});
  }
  const result={scope:'Render demo y seis acciones de navegación; no prueba escrituras, auth ni PostgreSQL',results,actions,passed:results.every(r=>!r.errors.length&&!r.http.length&&!r.overflow&&r.text>100)&&actions.every(a=>a.passed),hashes:require('./demo-audit.cjs').audit().hashes};
  console.log(JSON.stringify({...result,hashes:'Ver evidencia'},null,2));
  if(process.env.AITHRON_FINAL_VALIDATION==='1')console.log(require('./final-evidence.cjs').saveFinalEvidence('DEMO_SMOKE.json',result));
  if(!result.passed)process.exitCode=1;
 }finally{socket?.close();browser.kill();server.close();console.log(`Perfil temporal de pruebas conservado: ${profile}`);}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
