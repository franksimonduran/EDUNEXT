const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:8087/';
const student=base+'student/';
const previews=path.resolve(__dirname,'../docs/previews');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext();const page=await context.newPage();
 const errors=[],mutations=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('request',request=>{if(request.method()!=='GET'||!request.url().startsWith(base))mutations.push(request.url());});
 const ready=()=>page.waitForFunction(()=>document.querySelector('#learning-main')?.getAttribute('aria-busy')==='false');
 async function open(file){await page.goto(student+file);await ready();}
 async function answer(question,value=question.answer){
  if(['multiple','boolean','image'].includes(question.type))await page.locator(`[name="answer"][value="${value}"]`).check();
  if(question.type==='word')await page.locator('#written-answer').fill(Array.isArray(value)?value[0]:value);
  if(question.type==='numeric')await page.locator('#written-answer').fill(String(value).replace('.',','));
  if(question.type==='matching')for(const [left,right] of Object.entries(value))await page.locator(`[data-pair="${left}"]`).selectOption(right);
  if(question.type==='ordering')for(let target=0;target<value.length;target++){
   let ids=await page.locator('.ordering-list li').evaluateAll(items=>items.map(item=>item.querySelector('[data-move]').dataset.move));
   while(ids.indexOf(value[target])>target){await page.locator(`[data-move="${value[target]}"][data-direction="-1"]`).click();ids=await page.locator('.ordering-list li').evaluateAll(items=>items.map(item=>item.querySelector('[data-move]').dataset.move));}
  }
 }
 async function submitAndNext(){await page.locator('#activity-question [type="submit"]').click();await page.locator('#next-question').click();}
 async function capture(name,width){await page.setViewportSize({width,height:960});if(width>1100&&await page.locator('#student-shell').evaluate(el=>el.classList.contains('is-collapsed')))await page.locator('#sidebar-toggle').click();await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(220);await page.screenshot({path:path.join(previews,name+'.png'),fullPage:true,animations:'disabled'});}
 async function audit(label){if(!process.env.AXE_MODULE)return;const {default:AxeBuilder}=require(process.env.AXE_MODULE);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();if(result.violations.length)console.log(JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,message:n.failureSummary}))})),null,2));assert.deepEqual(result.violations.map(v=>v.id),[],label);}
 try{
  await open('practica.html?grade=4');
  const data=await page.evaluate(async()=>{
   const {getPracticesDemo}=await import('../js/data/practices-demo.data.js');const {getGamesDemo}=await import('../js/data/games-demo.data.js');
   return {practices:[4,5,6].flatMap(getPracticesDemo),games:[4,5,6].flatMap(getGamesDemo)};
  });
  assert.equal(data.practices.length,15);assert.equal(data.games.length,15);
  assert(data.practices.every(activity=>activity.questions.length>=3&&activity.questions.length<=5));
  assert.equal(new Set(data.practices.flatMap(activity=>activity.questions.map(question=>question.type))).size,7);
  const validations=await page.evaluate(async()=>{
   const {validateAnswer}=await import('../js/utils/answer-validation.js');const {calculateScore}=await import('../js/utils/score-calculator.js');
   return {blank:validateAnswer({type:'numeric',answer:0},''),nan:validateAnswer({type:'numeric',answer:1},'abc'),comma:validateAnswer({type:'numeric',answer:.9,normalization:{decimalComma:true,tolerance:0}},'0,90'),accent:validateAnswer({type:'word',answer:['sí'],normalization:{trim:true,caseInsensitive:true}},'si'),normalized:validateAnswer({type:'word',answer:['Hola'],normalization:{trim:true,caseInsensitive:true}},' HOLA '),score:calculateScore([{attempts:[{correct:false},{correct:true}],hintsUsed:2},{attempts:[{correct:true}],hintsUsed:0}])};
  });
  assert.equal(validations.blank.valid,false);assert.equal(validations.nan.valid,false);assert.equal(validations.comma.correct,true);assert.equal(validations.accent.correct,false);assert.equal(validations.normalized.correct,true);assert.equal(validations.score.percent,50);assert.equal(validations.score.hints,2);
  for(const grade of [4,5,6]){await open('practica.html?grade='+grade);assert.equal(await page.locator('.practice-card').count(),5);await page.locator('#filter-course').selectOption('math');await page.locator('#filter-difficulty').selectOption('easy');assert.equal(await page.locator('.practice-card').count(),1);await page.locator('#filter-difficulty').selectOption('advanced');assert.equal(await page.locator('.practice-card').count(),0);assert(await page.locator('.empty-state').isVisible());}
  let scoredResult;
  for(const activity of data.practices){
   await open(`ejercicio.html?grade=${activity.grade}&activity=${activity.id}`);
   for(let index=0;index<activity.questions.length;index++){
    const question=activity.questions[index];
    if(activity.id==='practice-math-4'&&index===0){
     await page.locator('#activity-question [type="submit"]').click();assert.match(await page.locator('#answer-message').innerText(),/Completa/);
     await page.locator('#written-answer').fill('10');await page.locator('#show-hint').click();
     await page.locator('#language-select').selectOption('en');assert.equal(await page.locator('#written-answer').inputValue(),'10');
     await page.reload();await ready();assert.equal(await page.locator('#written-answer').inputValue(),'10');assert.equal(await page.locator('#hint-content p').count(),1);
     await page.locator('#language-select').selectOption('es');
     await page.locator('#activity-question [type="submit"]').click();await page.locator('.answer-feedback.is-incorrect').waitFor({state:'visible'});
     await page.locator('#retry-answer').click();
    }
    await answer(question);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${activity.id}/${question.type} overflow`);
    await page.evaluate(()=>{const form=document.querySelector('#activity-question');form.requestSubmit();form.requestSubmit();});
    await page.locator('.answer-feedback.is-correct').waitFor({state:'visible'});
    await page.locator('#next-question').click();
   }
   await page.waitForURL('**/resultado-practica.html?**');await ready();
   const metrics=await page.locator('.result-metrics dd').allTextContents();
   const first=activity.id==='practice-math-4';
   assert.deepEqual(metrics.slice(0,4),first?['4','3','1','75%']:['4','4','0','100%']);
   if(first){scoredResult=page.url();assert.equal(metrics[4],'1');assert.equal(metrics[5],'30');await page.locator('#answer-review summary').click();assert.equal(await page.locator('#answer-review article').count(),4);await capture('practice-results-desktop',1440);await capture('practice-results-mobile',320);}
  }
  console.log('15 practices / 60 questions: all seven types, first-check scoring, retries, hints, reload, ES/EN and actual results OK');
  await page.setViewportSize({width:1440,height:960});
  for(const game of data.games){
   await open(`juego.html?grade=${game.grade}&activity=${game.id}`);
   if(game.type==='memory'){
    if(game.grade===4){
     await page.locator(`[data-memory="${game.pairs[0].id}-left"]`).click();await page.locator(`[data-memory="${game.pairs[1].id}-left"]`).click();
     assert.equal(await page.locator('.memory-card.is-open').count(),2);
     await page.locator(`[data-memory="${game.pairs[2].id}-left"]`).click();assert.equal(await page.locator('.memory-card.is-open').count(),2);
     await page.waitForFunction(()=>document.querySelectorAll('.memory-card.is-open').length===0);
     await page.locator(`[data-memory="${game.pairs[0].id}-left"]`).click();await page.locator(`[data-memory="${game.pairs[1].id}-left"]`).click();
     await page.locator('#hide-memory').click();assert.equal(await page.locator('.memory-card.is-open').count(),0);
    }
    for(const pair of game.pairs){await page.locator(`[data-memory="${pair.id}-left"]`).click();await page.locator(`[data-memory="${pair.id}-right"]`).click();}
    assert.equal(await page.locator('.memory-card.is-matched').count(),6);
    if(game.grade===4){assert.equal(await page.locator('.memory-picture svg').count(),3);await capture('game-memory-complete',1440);await capture('game-memory-complete-mobile',320);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await page.locator('#memory-results').click();
   }else for(const question of game.questions){await answer(question);await submitAndNext();}
   await page.waitForURL('**/resultado-practica.html?**');await ready();
   assert.match(await page.locator('h1').innerText(),/Juego terminado/);
   if(game.type==='memory'&&game.grade===4){assert.equal(await page.locator('.result-metrics dd').nth(0).innerText(),'5');assert.equal(await page.locator('.result-metrics dd').nth(3).innerText(),'60%');}
   else assert.equal(await page.locator('.result-metrics dd').nth(3).innerText(),'100%');
  }
  console.log('15 games: memory, matching, ordering, word and untimed challenge all finished; memory move accuracy OK');
  await open('practica.html?grade=4');await page.locator('#filter-state').selectOption('done');assert.equal(await page.locator('.practice-card').count(),5);await page.locator('#filter-course').selectOption('math');assert.equal(await page.locator('.practice-card').count(),1);
  await page.goto(scoredResult);await ready();await page.locator('[data-restart]').click();await ready();assert.equal(await page.locator('.answer-feedback').count(),0);assert.equal(await page.locator('#written-answer').inputValue(),'');assert.equal(await page.locator('#hint-content p').count(),0);
  const incompleteUrl=page.url();await page.locator('.activity-exit a').first().click();await ready();assert(await page.locator(`.practice-card a[href*="${new URL(incompleteUrl).searchParams.get('run')}"]`).isVisible());
  for(const [name,file] of [['practice-catalog','practica.html?grade=4'],['practice-exercise','ejercicio.html?grade=4&activity=practice-math-4'],['games-catalog','juegos.html?grade=4'],['game-memory','juego.html?grade=4&activity=game-memory-4'],['practice-results',scoredResult.replace(student,'')]]){
   await open(file);
   for(const width of [320,375,768,1024,1440,1920]){await page.setViewportSize({width,height:960});await page.waitForTimeout(200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} overflow ${width}`);}
   for(const [suffix,width] of [['desktop',1440],['mobile',320]]){await capture(`${name}-${suffix}`,width);await audit(name+' '+width);}
   const broken=await page.evaluate(async()=>{const urls=[...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map(el=>el.href||el.src).filter(url=>!url.includes('#'));return(await Promise.all(urls.map(async url=>[url,(await fetch(url)).status]))).filter(([,status])=>status!==200);});assert.deepEqual(broken,[]);
  }
  await page.setViewportSize({width:1440,height:960});
  for(const file of ['ejercicio.html?grade=4&activity=missing','juego.html?grade=4&activity=game-memory-5','ejercicio.html?grade=4&grade=5&activity=practice-math-4','ejercicio.html?grade=4&activity=practice-math-4&run=invalid']){await open(file);assert.match(await page.locator('h1').innerText(),/Contenido no encontrado/);}
  await open('resultado-practica.html?grade=4&percent=100');assert.match(await page.locator('h1').innerText(),/Todavía no hay/);
  await open('ejercicio.html?grade=4&activity=practice-english-4');
  const attack='<img src=x onerror="window.injected=true">';await page.locator('#written-answer').fill(attack);await page.locator('#activity-question [type="submit"]').click();
  assert.equal(await page.evaluate(()=>window.injected),undefined);
  await page.reload();await ready();assert.equal(await page.locator('#written-answer').inputValue(),attack);assert.equal(await page.evaluate(()=>window.injected),undefined);
  await open('ejercicio.html?grade=4&activity=practice-reading-4');
  await page.locator('[name="answer"]').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[name="answer"]:checked').count(),1);
  await page.locator('#show-hint').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#hint-content p').count(),1);
  const keyboardGame=data.games.find(game=>game.type==='ordering'&&game.grade===4);await open(`juego.html?grade=4&activity=${keyboardGame.id}`);const move=page.locator('[data-move="title"][data-direction="-1"]');await move.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.move),'title');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.student-workspace').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  // Integración con una lección real y retorno a su identificador exacto.
  await open('leccion.html?grade=5&course=math&unit=math-g5-u1&lesson=math-g5-u1-l3');await page.locator('#tab-practice').click();await page.locator('.full-practice-link').click();await ready();
  const math5=data.practices.find(activity=>activity.id==='practice-math-5');for(const question of math5.questions){await answer(question);await submitAndNext();}await page.waitForURL('**/resultado-practica.html?**');await ready();await page.locator('.result-actions a[href*="leccion.html"]').click();await ready();assert.equal(new URL(page.url()).searchParams.get('lesson'),'math-g5-u1-l3');
  assert.deepEqual(await page.evaluate(()=>Object.keys(sessionStorage)),['aithron.demo.activities.v1']);assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);
  const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new Error('storage disabled');}}));const fallback=await blocked.newPage();await fallback.goto(student+'juego.html?grade=4&activity=game-word-4');await fallback.waitForSelector('#written-answer');
  for(const word of ['dog','cat','bird']){await fallback.locator('#written-answer').fill(word);await fallback.locator('[type="submit"]').click();await fallback.locator('#next-question').click();}
  await fallback.waitForSelector('.results-hero');assert.match(await fallback.locator('.result-metrics').innerText(),/100%/);await blocked.close();
  console.log('5 views × 6 widths, Axe, invalid IDs, session resume/restart, input escaping, keyboard, storage fallback and Aprende integration OK');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
