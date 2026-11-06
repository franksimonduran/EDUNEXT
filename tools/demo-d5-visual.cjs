// EDUNEXT D5: comprobación visual (no es auditoría WCAG ni Lighthouse).
// Exclusivamente el frontend ficticio; capturas guardadas como artefactos del CI.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {createDemoServer}=require('./demo-server.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const widths=[320,360,390,768,1024,1280,1440];
const routes=[
 'demo.html','offline-demo.html','student/recorrido-demo.html',
 'student/progreso-demo.html','monitor/seguimiento-demo.html','admin/informe-demo.html',
 'student/tutor-demo.html','student/traductor-demo.html','student/pronuncia-demo.html',
 'monitor/herramientas-ia-demo.html','admin/herramientas-ia-demo.html',
 'student/index.html?grade=5&modo=demo','monitor/index.html?modo=demo','admin/index.html?modo=demo'
];
const screenshotRoutes=new Set(['demo.html','student/recorrido-demo.html','monitor/seguimiento-demo.html','admin/informe-demo.html','student/tutor-demo.html','offline-demo.html']);
async function main(){
 const server=createDemoServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const browserExe=process.env.DEMO_BROWSER||[
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
 ].find(fs.existsSync);
 if(!browserExe){server.close();throw new Error('Configura DEMO_BROWSER con una ruta a Chrome/Chromium.');}
 const directory=process.env.D5_VISUAL_DIR||path.join(__dirname,'..','artifacts','d5-visual');
 fs.mkdirSync(directory,{recursive:true});
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'edunext-d5-'));
 const args=['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
 if(process.platform==='linux'&&(process.env.CI==='true'||process.env.GITHUB_ACTIONS==='true'))args.push('--no-sandbox','--disable-dev-shm-usage');
 const browser=spawn(browserExe,args,{stdio:['ignore','ignore','pipe']});
 let stderr='',socket=null,index=0,current=null;
 const pending=new Map(),observations=[],issues=[];
 browser.stderr?.on('data',part=>{stderr=(stderr+String(part)).slice(-4500);});
 try{
  let port;
  for(let i=0;i<300;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await wait(100);}}
  if(!port)throw new Error('Chrome CDP no inició: '+stderr);
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=event=>{
   const m=JSON.parse(event.data);
   if(m.id){const item=pending.get(m.id);if(!item)return;clearTimeout(item.timer);pending.delete(m.id);m.error?item.reject(new Error(m.error.message)):item.resolve(m.result);return;}
   if(!current)return;
   if(m.method==='Runtime.exceptionThrown')current.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
   if(m.method==='Network.responseReceived'&&m.params.response.status>=400)current.http.push({code:m.params.response.status,url:m.params.response.url});
  };
  const command=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++index;
   pending.set(id,{resolve,reject,timer:setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},20000)});
   socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
   const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
   if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||'Error al evaluar página');
   return result.result.value;
  };
  const poll=async(expression,loops=80)=>{
   for(let i=0;i<loops;i++){const result=await evaluate(expression);if(result)return;await wait(100);}
   throw new Error('No se cargó el control esperado: '+expression.slice(0,140));
  };
  await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
  await command('Network.setCacheDisabled',{cacheDisabled:true});
  const targetSelectors={
   'demo.html':'.profiles','offline-demo.html':'.package-card',
   'student/recorrido-demo.html':'#demo-activity input[name="answer"]',
   'student/progreso-demo.html':'.d2-card',
   'monitor/seguimiento-demo.html':'#d2-monitor-rows',
   'admin/informe-demo.html':'#d2-admin-rows',
   'student/tutor-demo.html':'#d3-answer',
   'student/traductor-demo.html':'#d3-translate',
   'student/pronuncia-demo.html':'#d3-check-meaning',
   'monitor/herramientas-ia-demo.html':'.d3-grid',
   'admin/herramientas-ia-demo.html':'.d3-grid',
   'student/index.html':'#dashboard-content',
   'monitor/index.html':'#dashboard-content',
   'admin/index.html':'#admin-content'
  };
  const baseRoute=route=>route.split('?')[0];
  const navigate=async(route,width)=>{
   current={route,width,errors:[],http:[]};
   await command('Page.navigate',{url:base+route});
   const selector=targetSelectors[baseRoute(route)];
   await poll('document.readyState==="complete" && Boolean(document.querySelector('+JSON.stringify(selector)+'))',150);
   await wait(120);
   const measure=await evaluate(`JSON.stringify((()=>{
    const skip=document.querySelector('a.skip-link, a.skip');
    const href=skip?.getAttribute('href');
    const content=href?.startsWith('#')?document.getElementById(href.slice(1)):null;
    const images=[...document.images].filter(i=>i.complete && i.naturalWidth===0).map(i=>i.getAttribute('src'));
    const badControls=[...document.querySelectorAll('button:not([hidden]),a[href]:not([hidden])')]
      .filter(el=>!el.closest('[hidden]')&&!el.textContent.trim()&&!el.getAttribute('aria-label')&&!el.querySelector('img[alt]'))
      .map(el=>el.outerHTML.slice(0,130)).slice(0,8);
    const timing=performance.getEntriesByType('navigation')[0];
    return {
      title:document.title,
      viewport:innerWidth,
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      text:document.body.innerText.length,
      headings:document.querySelectorAll('main h1').length,
      lang:document.documentElement.lang,
      skipTarget:!!content,
      css:!![...document.styleSheets].find(s=>String(s.href||'').includes('demo-polish-d5.css')),
      brokenImages:images,
      unnamedControls:badControls,
      domContentLoadedMs:Math.round(timing?.domContentLoadedEventEnd||0)
    };
   })())`);
   Object.assign(current,JSON.parse(measure));
   observations.push(current);
   const publicJourney=!/^(?:student|monitor|admin)\/index\.html$/.test(baseRoute(route));
   if(current.overflow||current.errors.length||current.http.length||current.text<120||!current.skipTarget||!current.css||current.headings!==1||current.lang!=='es'||current.brokenImages.length||(publicJourney&&current.unnamedControls.length)){
    issues.push({...current});
   }
  };
  for(const width of widths){
   await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   for(const route of routes){
    await navigate(route,width);
    if(screenshotRoutes.has(route)&&(width===360||width===1280)){
     const screenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
     const name=baseRoute(route).replaceAll('/','-').replace('.html','')+'-'+width+'.png';
     fs.writeFileSync(path.join(directory,name),Buffer.from(screenshot.data,'base64'));
    }
   }
  }
  // Testeos funcionales de teclado: focus tras cambiar pregunta y Enter en diccionario.
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
  await navigate('student/recorrido-demo.html',390);
  const quizFocus=await evaluate(`(()=>{
    const radio=document.querySelector('input[name="answer"][value="1"]');if(!radio)return false;
    radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('button[data-action="next"]').click();
    return document.activeElement?.id==='quiz-title'&&document.querySelector('#quiz-title')?.textContent.includes('regaban');
  })()`);
  await navigate('student/traductor-demo.html',390);
  const enterSearch=await evaluate(`(()=>{
    const input=document.querySelector('#d3-search');input.value='Escuela';
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    return document.querySelector('#d3-translation-result')?.innerText.includes('School');
  })()`);
  if(!quizFocus||!enterSearch)issues.push({route:'teclado',quizFocus,enterSearch});
  const info={status:issues.length?'FAIL':'PASS',screenChecks:observations.length,
   testedWidths:widths,routes:routes.length,screenshots:12,quizFocus,enterSearch,
   disclaimer:'Auditoría automatizada parcial. No equivale a certificación WCAG 2.2 ni Lighthouse.',
   issues,observations};
  fs.writeFileSync(path.join(directory,'D5_REPORT.json'),JSON.stringify(info,null,2)+'\n');
  console.log(JSON.stringify({status:info.status,screenChecks:info.screenChecks,widths,issues:issues.slice(0,8),quizFocus,enterSearch},null,2));
  assert.equal(issues.length,0,'D5 detectó problemas visuales o de accesibilidad estructural');
 }catch(error){
  console.error('EDUNEXT D5 VISUAL FAILED:',error.stack);
  if(!fs.existsSync(path.join(directory,'D5_REPORT.json'))){
   fs.writeFileSync(path.join(directory,'D5_REPORT.json'),JSON.stringify({status:'ERROR',errors:[String(error)],observations},null,2));
  }
  process.exitCode=1;
 }finally{socket?.close();browser.kill();server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
