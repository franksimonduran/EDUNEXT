const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:8087/';
const student=base+'student/';
const output=path.resolve(__dirname,'../docs/previews');
const lesson='grade=5&course=math&unit=math-g5-u1&lesson=math-g5-u1-l3';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext();const page=await context.newPage();
 const errors=[],unexpected=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('request',request=>{if(request.method()!=='GET'||!request.url().startsWith(base))unexpected.push(request.url());});
 const ready=()=>page.waitForFunction(()=>document.querySelector('#learning-main')?.getAttribute('aria-busy')==='false');
 async function open(file='tutor.html?grade=5'){await page.goto(student+file);await ready();}
 async function details(id){if(!await page.locator('#'+id).evaluate(el=>el.open))await page.locator('#'+id+' > summary').click();}
 async function settled(){await page.waitForFunction(()=>document.querySelector('#tutor-composer')?.getAttribute('aria-busy')==='false');}
 async function capture(name,width){await page.setViewportSize({width,height:1000});if(width>1100&&await page.locator('#student-shell').evaluate(el=>el.classList.contains('is-collapsed')))await page.locator('#sidebar-toggle').click();await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(220);await page.screenshot({path:path.join(output,name+'.png'),fullPage:true,animations:'disabled'});}
 async function audit(label){if(!process.env.AXE_MODULE)return;const {default:AxeBuilder}=require(process.env.AXE_MODULE);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();if(result.violations.length)console.log(JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,message:n.failureSummary}))})),null,2));assert.deepEqual(result.violations.map(v=>v.id),[],label);}
 try{
  await open();assert.equal(await page.locator('h1').innerText(),'EDUNEXT AI');assert.equal(await page.locator('[data-tutor-intent]').count(),4);
  await details('tutor-context');assert(await page.locator('.context-empty').isVisible());
  const examples=await page.evaluate(async()=>{const {loadTutorDemo}=await import('../js/data/tutor-demo.data.js');return (await Promise.all([4,5,6].map(grade=>loadTutorDemo(grade)))).flatMap(data=>data.examples);});
  assert.equal(examples.length,15);assert.equal(new Set(examples.map(item=>item.id)).size,15);
  await page.locator('#tutor-send').click();assert.match(await page.locator('#tutor-input-error').innerText(),/Escribe/);assert.equal(await page.locator('.tutor-message-user').count(),0);
  await page.locator('#tutor-question').evaluate(input=>{input.value='x'.repeat(1001);});await page.locator('#tutor-send').click();assert.match(await page.locator('#tutor-input-error').innerText(),/límite/);assert.equal(await page.locator('.tutor-message-user').count(),0);
  await page.locator('#tutor-question').fill('Una pregunta');await page.locator('#tutor-question').press('Shift+Enter');await page.locator('#tutor-question').press('a');assert.match(await page.locator('#tutor-question').inputValue(),/\n/);
  await page.locator('#tutor-question').press('Enter');await settled();assert.equal(await page.locator('.tutor-message-user').count(),1);assert.match(await page.locator('.tutor-notice').innerText(),/necesita conectarse al servicio/);assert.equal(await page.locator('#tutor-mode').getAttribute('data-mode'),'unavailable');
  const attack='<img src=x onerror="window.tutorInjected=true">';await page.locator('#tutor-question').fill(attack);await page.locator('#tutor-send').click();await settled();assert.equal(await page.locator('.tutor-message-user').last().locator('.tutor-bubble').innerText(),attack);assert.equal(await page.evaluate(()=>window.tutorInjected),undefined);assert.equal(await page.locator('.tutor-message-user img').count(),0);assert(!page.url().includes('pregunta'));assert(!page.url().includes('onerror'));
  await open();await capture('tutor-welcome-desktop',1440);await capture('tutor-welcome-mobile',320);
  for(const grade of [4,5,6]){
   await page.setViewportSize({width:1440,height:1000});await open('tutor.html?grade='+grade);
   for(const [index,example] of examples.filter(item=>item.grade===grade).entries()){
    if(index){await details('tutor-conversations');await page.locator('#new-tutor-conversation').click();}
    await page.locator('#tutor-question').fill(example.prompt);await page.locator('#tutor-question').press('Enter');await settled();
    assert.equal(await page.locator('.tutor-message-assistant').count(),1);assert.match(await page.locator('.tutor-message-assistant').innerText(),/Respuesta predefinida/);assert.equal(await page.locator('#tutor-mode').getAttribute('data-mode'),'demonstration');
    assert.match(await page.locator('.tutor-message-assistant').innerText(),new RegExp(example.explanation.slice(0,16).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    if(example.courseId==='math')assert.equal(await page.locator('.tutor-fraction').count(),1);
   }
  }
  console.log('Tutor: validation, 15 grade/subject examples, safe free text, Enter/Shift+Enter and honest unavailable mode OK');
  for(const intent of ['explain','example','guide','review']){
   await open();await page.locator(`[data-tutor-intent="${intent}"]`).click();assert(await page.locator('#dashboard-dialog').isVisible());
   await page.locator('#dashboard-dialog [data-tutor-example]').first().click();await settled();assert.equal(await page.locator('.tutor-message-assistant').count(),1);
  }
  await open('tutor.html?'+lesson);await details('tutor-context');assert.equal(await page.locator('.context-empty').count(),0);assert.match(await page.locator('#tutor-context-content').innerText(),/Relaciona fracciones y decimales/);
  const back=await page.locator('#tutor-context-content a').getAttribute('href');assert.equal(new URL(back,student).searchParams.get('lesson'),'math-g5-u1-l3');
  await page.locator('[data-tutor-intent="explain"]').click();await settled();assert.equal(await page.locator('.tutor-message-assistant').count(),1);assert.equal(await page.locator('.tutor-fraction span').first().innerText(),'5');
  for(const key of ['easy','steps','another','drawing','hint']){
   await page.locator('#tutor-strategies').click();await page.locator(`#dashboard-dialog [data-tutor-action="${key}"]`).click();await settled();
   const latest=page.locator('.tutor-message-assistant').last();assert.match(await latest.innerText(),/Respuesta predefinida/);if(key==='steps')assert.equal(await latest.locator('.tutor-steps li').count(),3);if(key==='drawing')assert(await latest.locator('svg[role="img"]').isVisible());
  }
  await capture('tutor-conversation-desktop',1440);await capture('tutor-conversation-mobile',320);
  // Desplazamiento: un mensaje nuevo no desplaza a quien consulta mensajes anteriores.
  await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(220);await page.locator('#tutor-log').evaluate(log=>{log.scrollTop=0;});
  await page.locator('#tutor-question').fill('Pregunta libre sin respuesta guardada');await page.locator('#tutor-send').click();await settled();assert.equal(await page.locator('#tutor-log').evaluate(log=>log.scrollTop),0);assert(await page.locator('#tutor-new-messages').isVisible());await page.locator('#tutor-new-messages').click();assert(await page.locator('#tutor-log').evaluate(log=>log.scrollHeight-log.scrollTop-log.clientHeight<64));
  await details('tutor-conversations');await page.locator('#new-tutor-conversation').click();await page.locator('#tutor-question').fill('Borrador en memoria');await page.locator('[data-tutor-conversation="conversation-1"]').click();assert(await page.locator('.tutor-message-user').count()>0);await page.locator('[data-tutor-conversation="conversation-2"]').click();assert.equal(await page.locator('#tutor-question').inputValue(),'Borrador en memoria');
  await page.locator('[data-tutor-intent="example"]').click();await settled();await page.locator('#clear-tutor-conversation').click();assert(await page.locator('#dashboard-dialog').isVisible());await page.locator('[data-cancel-tutor-clear]').click();assert.equal(await page.locator('.tutor-message-user').count(),1);await page.locator('#clear-tutor-conversation').click();await page.locator('[data-confirm-tutor-clear]').click();assert.equal(await page.locator('.tutor-message-user').count(),0);assert.equal(await page.locator('#tutor-question').inputValue(),'');assert.equal(await page.locator('[data-tutor-intent]').count(),4);
  await context.setOffline(true);await page.waitForFunction(()=>!navigator.onLine);await page.waitForSelector('#offline-notice:not([hidden])');assert.match(await page.locator('#offline-notice').innerText(),/ya cargados en esta página/);assert.equal(await page.locator('#tutor-mode').getAttribute('data-mode'),'offline');await page.locator('[data-tutor-intent="explain"]').click();await settled();assert.equal(await page.locator('.tutor-message-assistant').count(),1);await context.setOffline(false);await page.waitForFunction(()=>navigator.onLine);await page.waitForFunction(()=>document.querySelector('#offline-notice').hidden);
  await page.locator('#language-select').selectOption('en');assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.match(await page.locator('.tutor-composer').innerText(),/do not share/);assert.equal(await page.locator('.tutor-message-user').count(),1);await page.locator('#language-select').selectOption('es');
  for(const scenario of ['welcome','conversation']){
   await open(scenario==='welcome'?'tutor.html?grade=5':'tutor.html?'+lesson);
   if(scenario==='conversation'){await page.locator('[data-tutor-intent="explain"]').click();await settled();}
   for(const width of [320,375,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${scenario}/${width} overflow`);if(width===320){assert(await page.locator('.tutor-heading h1').evaluate(el=>el.getBoundingClientRect().height<70));assert(await page.locator('.tutor-heading p').evaluate(el=>el.getBoundingClientRect().height<110));}}
   for(const width of [1440,320]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(200);await audit(scenario+' '+width);}
  }
  // Contexto y conversaciones son desplegables utilizables en móvil.
  await page.locator('#tutor-context > summary').click();assert(await page.locator('#tutor-context-content').isVisible());await page.locator('#tutor-context > summary').click();assert.equal(await page.locator('#tutor-context-content').isVisible(),false);await details('tutor-conversations');assert(await page.locator('#new-tutor-conversation').isVisible());
  await page.setViewportSize({width:1440,height:1000});await page.locator('#tutor-strategies').click();await audit('strategies dialog');await page.keyboard.press('Escape');await page.locator('#clear-tutor-conversation').click();await audit('clear confirmation');await page.keyboard.press('Escape');
  await page.locator('#tutor-question').focus();assert.notEqual(await page.locator('#tutor-question').evaluate(el=>getComputedStyle(el).boxShadow),'none');await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.tutor-suggestions button').count(),0);await page.emulateMedia({reducedMotion:'no-preference'});
  const storage=await page.evaluate(async()=>({local:localStorage.length,session:sessionStorage.length,databases:await indexedDB.databases()}));assert.deepEqual(storage,{local:0,session:0,databases:[]});
  await page.reload();await ready();assert.equal(await page.locator('.tutor-message-user').count(),0);assert.equal(await page.locator('[data-tutor-conversation]').count(),1);
  for(const file of ['tutor.html?grade=8','tutor.html?grade=4&course=math','tutor.html?grade=4&course=reading&unit=math-g4-u1&lesson=math-g4-u1-l1','tutor.html?grade=4&course=math&unit=math-g4-u1&lesson=missing','tutor.html?grade=4&grade=5']){await open(file);assert.match(await page.locator('h1').innerText(),/Contenido no encontrado/);}
  // Recorrido desde No entendí y enlaces con contexto académico válido.
  await open('leccion.html?'+lesson);await page.locator('#help-button').click();await page.locator('[data-help="tutor"]').click();await page.locator('#lesson-tutor-link').click();await ready();assert.match(await page.locator('#tutor-context-content').innerText(),/Relaciona fracciones y decimales/);await page.locator('[data-tutor-intent="explain"]').click();await settled();
  const practiceAction=page.locator('.tutor-quick-actions [data-tutor-action="practice"]').last();await practiceAction.click();await ready();assert.equal(new URL(page.url()).searchParams.get('activity'),'practice-math-5');assert.equal(new URL(page.url()).searchParams.get('lesson'),'math-g5-u1-l3');
  await page.goto(student+'index.html');await page.waitForFunction(()=>document.querySelector('#dashboard-main').getAttribute('aria-busy')==='false');await page.locator('#quick-access [data-section="tutor"]').click();await ready();assert.equal(await page.locator('.context-empty').count(),1);
  const broken=await page.evaluate(async()=>{const urls=[...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map(el=>el.href||el.src).filter(url=>!url.includes('#'));return(await Promise.all(urls.map(async url=>[url,(await fetch(url)).status]))).filter(([,status])=>status!==200);});assert.deepEqual(broken,[]);
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  // Prueba controlada de espera: el frontend no fabrica una animación de IA.
  const waiting=await context.newPage();waiting.on('pageerror',error=>errors.push(error.message));
  await waiting.route('**/js/services/tutor.service.js',async route=>{
   const response=await route.fetch();let source=await response.text();
   source=source.replace('export async function getTutorDemoResponse','async function originalDemoResponse');
   await route.fulfill({contentType:'text/javascript',body:source+'\nexport async function getTutorDemoResponse(request){window.demoCalls=(window.demoCalls||0)+1; await new Promise(resolve=>{window.releaseTutorDemo=resolve;});const response=await originalDemoResponse(request);window.demoDone=(window.demoDone||0)+1;return response;}'});
  });
  await waiting.goto(student+'tutor.html?'+lesson);await waiting.waitForSelector('[data-tutor-intent="explain"]');
  await waiting.locator('[data-tutor-intent="explain"]').click();assert.equal(await waiting.locator('#tutor-send').isDisabled(),true);
  await waiting.locator('#tutor-composer').evaluate(form=>form.requestSubmit());assert.equal(await waiting.evaluate(()=>window.demoCalls),1);
  await waiting.locator('#new-tutor-conversation').click();await waiting.locator('#tutor-question').fill('Otro borrador');
  await waiting.evaluate(()=>window.releaseTutorDemo());await waiting.waitForFunction(()=>window.demoDone===1);
  assert.equal(await waiting.locator('.tutor-message-assistant').count(),0);assert.equal(await waiting.locator('#tutor-question').inputValue(),'Otro borrador');
  await waiting.locator('[data-tutor-conversation="conversation-1"]').click();assert.equal(await waiting.locator('.tutor-message-assistant').count(),1);
  await waiting.locator('.tutor-quick-actions [data-tutor-action="hint"]').click();await waiting.locator('#clear-tutor-conversation').click();await waiting.locator('[data-confirm-tutor-clear]').click();
  await waiting.evaluate(()=>window.releaseTutorDemo());await waiting.waitForFunction(()=>window.demoDone===2);
  assert.equal(await waiting.locator('.tutor-message-user').count(),0);assert.equal(await waiting.locator('.tutor-message-assistant').count(),0);assert.equal(await waiting.locator('#tutor-send').isEnabled(),true);await waiting.close();
  const failing=await context.newPage();await failing.route('**/js/services/tutor.service.js',route=>route.fulfill({contentType:'text/javascript',body:'export async function getTutorDemoResponse(){throw new Error("controlled test");}'}));await failing.goto(student+'tutor.html?'+lesson);await failing.waitForSelector('[data-tutor-intent="explain"]');await failing.locator('[data-tutor-intent="explain"]').click();await failing.waitForSelector('.tutor-notice');assert.match(await failing.locator('.tutor-notice').innerText(),/No se pudo consultar/);assert.equal(await failing.locator('#tutor-send').isEnabled(),true);await failing.close();
  console.log('Tutor: suggestions, 15 examples, strategies, math, conversations, clear, context, offline, privacy, accessibility, 6 widths, delayed/error states and regressions integration OK');
  assert.deepEqual(errors,[]);
 }catch(error){
  console.log(await page.evaluate(()=>({width:innerWidth,height:innerHeight,y:scrollY,details:document.querySelector('#tutor-conversations')?.open,dialog:document.querySelector('#dashboard-dialog')?.open,clear:document.querySelector('#clear-tutor-conversation')?.getBoundingClientRect().toJSON(),log:document.querySelector('#tutor-log')?.getBoundingClientRect().toJSON()})));
  await page.screenshot({path:path.join(output,'tutor-test-failure.png'),fullPage:true,animations:'disabled'});throw error;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
