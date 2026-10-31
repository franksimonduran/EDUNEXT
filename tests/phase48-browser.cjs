// Public static login only, real installed browsers via CDP. No backend impersonation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),net=require('node:net'),os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),frontend=path.join(root,'frontend');
const temp=path.join(os.tmpdir(),'opencode');
fs.mkdirSync(temp,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname.startsWith('/api/')){res.writeHead(503);return res.end('API not running in static fixture');}
  const file=path.resolve(frontend,'.'+(pathname==='/'?'/login.html':pathname));
  if(!file.startsWith(frontend+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);return res.end('Not found');
  }
  if(!fs.realpathSync(file).startsWith(fs.realpathSync(frontend)+path.sep)){res.writeHead(403);return res.end();}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end('Bad request');}
});
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));return port;}
async function connect(url){
 const ws=new WebSocket(url),pending=new Map();let id=0;const errors=[],loaded=new Set();
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Page.lifecycleEvent'&&m.params.name==='load')loaded.add(m.params.loaderId);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};
 function call(method,params={}){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error('CDP timeout: '+method));},10000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});}
 return {call,errors,loaded,close:()=>ws.close(),evaluate:async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error('Browser evaluation failed');return r.result.value;}};
}
async function navigate(cdp,url){
 const navigation=await cdp.call('Page.navigate',{url});
 if(navigation.errorText||!navigation.loaderId)throw new Error('Expected a fresh document navigation');
 for(let i=0;i<100;i++){if(cdp.loaded.has(navigation.loaderId))return;await delay(50);}
 throw new Error('Document load not observed for the current navigation');
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const results=[];
 for(const [name,exe] of [['Edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],['Chrome','C:/Program Files/Google/Chrome/Application/chrome.exe']]){
  if(!fs.existsSync(exe)){results.push({name,status:'blocked',reason:'Executable absent'});continue;}
  const port=await freePort(),profile=fs.mkdtempSync(path.join(temp,'phase48-'+name.toLowerCase()+'-'));
  const child=spawn(exe,['--headless=new','--disable-extensions','--disable-background-networking','--disable-sync','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  let cdp;
  try{
   let version;
   for(let i=0;i<80;i++){try{version=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();break;}catch{await delay(100);}}
   if(!version)throw new Error('Browser debugging startup unavailable');
   const tab=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
   cdp=await connect(tab.webSocketDebuggerUrl);await cdp.call('Page.enable');await cdp.call('Page.setLifecycleEventsEnabled',{enabled:true});await cdp.call('Runtime.enable');
   const checks=[];
    for(const [width,height] of [[320,720],[375,812],[768,1024],[1440,900],[1366,768],[1280,600]]){
    await cdp.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await navigate(cdp,base+'/login.html');
    for(let i=0;i<60;i++){if(await cdp.evaluate("document.readyState==='complete' && document.querySelector('#submit-button')?.disabled===false"))break;await delay(50);}
    checks.push(await cdp.evaluate(`({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,lang:document.documentElement.lang,h1:document.querySelectorAll('h1').length,main:Boolean(document.querySelector('main')),unlabelled:[...document.querySelectorAll('input:not([type=hidden])')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).length,navigationMs:performance.getEntriesByType('navigation')[0]?.duration})`));
   }
    const desktopFit = await cdp.evaluate('({width:innerWidth,height:innerHeight,documentHeight:document.documentElement.scrollHeight,fits:document.documentElement.scrollHeight<=innerHeight})');
    checks.push({desktopFit});
    await cdp.evaluate("document.querySelector('#submit-button').click()");
   const validation=await cdp.evaluate("({focus:document.activeElement.id,identifierInvalid:document.querySelector('#identifier').getAttribute('aria-invalid'),passwordInvalid:document.querySelector('#password').getAttribute('aria-invalid')})");
   await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
   await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
   const tabFocus=await cdp.evaluate('document.activeElement.id');
    const pass=checks.every(c=>c.desktopFit?c.desktopFit.fits:!c.overflow&&c.lang&&c.h1>0&&c.main&&c.unlabelled===0)&&validation.focus==='identifier'&&validation.identifierInvalid==='true'&&validation.passwordInvalid==='true'&&tabFocus!=='identifier'&&cdp.errors.length===0;
   results.push({name,version:version.Browser,status:pass?'pass':'fail',checks,validation,tabFocus,exceptions:[...cdp.errors],scope:'Static public login only. Desktop viewport emulation, not physical mobile, screen reader, WCAG or authenticated E2E.'});
   if(process.env.AITHRON_FINAL_VALIDATION==='1'){
    const pages=[
     ['/student/tutor.html?grade=4',"Boolean(document.querySelector('#ai-local-tab')) && Boolean(document.querySelector('#local-model-load'))"],
     ['/student/index.html?grade=4',"document.querySelector('#dashboard-main')?.getAttribute('aria-busy')==='false'"],
     ['/student/aprende.html?grade=4',"document.querySelector('#learning-main')?.getAttribute('aria-busy')==='false'"],
     ['/student/leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1',"document.querySelector('#learning-main')?.getAttribute('aria-busy')==='false'"],
     ['/monitor/index.html',"Boolean(document.querySelector('#dashboard-content .monitor-hero'))"],
     ['/admin/index.html',"Boolean(document.querySelector('#admin-content .admin-hero')) && document.querySelector('#admin-content')?.getAttribute('aria-busy')==='false'"]
    ];
    for(const [pathname,ready] of pages){
     const viewports=[];
     for(const [width,height] of [[375,812],[1440,900]]){
      const before=cdp.errors.length;
      await cdp.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await navigate(cdp,base+pathname);
      let loaded=false;
      for(let i=0;i<100;i++){if(await cdp.evaluate(ready)){loaded=true;break;}await delay(50);}
      const snapshot=await cdp.evaluate(`({title:document.title,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,main:Boolean(document.querySelector('main')),demoLabel:/demostraci[oó]n|fictici|muestra/i.test(document.body.innerText),navigationMs:performance.getEntriesByType('navigation')[0]?.duration})`);
       if(pathname.startsWith('/student/tutor.html')) {
        const initial=await cdp.evaluate("document.querySelector('#ai-online-panel').hidden && !document.querySelector('#ai-local-panel').hidden && document.querySelector('#local-model-load').disabled && document.querySelector('#local-model-load').textContent==='Iniciar IA'");
        await cdp.evaluate("document.querySelector('#local-model-consent').click()");
        const startEnabled=await cdp.evaluate("!document.querySelector('#local-model-load').disabled && document.querySelector('#local-question').disabled");
        await cdp.evaluate("document.querySelector('#local-model-consent').click()");
        await cdp.evaluate("document.querySelector('#ai-online-tab').click()");
        const online=await cdp.evaluate("document.querySelector('#ai-local-panel').hidden && !document.querySelector('#ai-online-panel').hidden && document.querySelector('#ai-online-send').disabled && document.querySelector('#ai-online-status').textContent.includes('sin comprobar')");
        await cdp.evaluate("document.querySelector('#ai-local-tab').click()");
        const returned=await cdp.evaluate("!document.querySelector('#ai-local-panel').hidden && document.querySelector('#local-model-consent').checked===false");
        loaded=loaded&&initial&&startEnabled&&online&&returned;
       }
       viewports.push({...snapshot,loaded,exceptions:cdp.errors.slice(before)});
     }
     results.push({name,version:version.Browser,page:pathname,status:viewports.every(v=>v.loaded&&v.main&&v.demoLabel&&!v.overflow&&v.exceptions.length===0)?'pass':'fail',viewports,scope:'Public demonstration UI only. No authenticated role, database, academic persistence or user study verified.'});
    }
   }
   const browser=await connect(version.webSocketDebuggerUrl);await browser.call('Browser.close').catch(()=>{});browser.close();
  }catch(e){results.push({name,status:'blocked',reason:e.message});}
  finally{cdp?.close();child.kill();}
 }
 const evidence={date:new Date().toISOString(),results,notes:['No real credentials or minors data','Disposable browser profiles retained in approved temp; no user profile touched','Navigation duration is local static fixture measurement, not production performance or Web Vitals']};
  require('../tools/final-evidence.cjs').saveEvidence('BROWSER_VALIDATION.json','docs/PHASE_48_BROWSER_EVIDENCE.json',evidence);console.log(JSON.stringify(evidence,null,2));
 if(results.some(r=>r.status!=='pass'))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>server.close());
