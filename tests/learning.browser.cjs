const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8087/';
const student = base + 'student/';
const output = path.resolve(__dirname, '../docs/previews');
const urls = {
 catalog:'aprende.html?grade=4',
 course:'curso.html?grade=4&course=math',
 unit:'unidad.html?grade=4&course=math&unit=math-g4-u1',
 lesson:'leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1',
};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 const errors=[],unexpected=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('request',request=>{if(request.method()!=='GET'||!request.url().startsWith(base))unexpected.push(request.url());});
 async function open(url) {
  await page.goto(student+url);
  await page.waitForFunction(()=>document.querySelector('#learning-main')?.getAttribute('aria-busy')==='false');
 }
 async function close(){await page.keyboard.press('Escape');assert.equal(await page.locator('#dashboard-dialog').isVisible(),false);}
 async function capture(name,width){await page.setViewportSize({width,height:960});if(width>1100&&await page.locator('#student-shell').evaluate(el=>el.classList.contains('is-collapsed')))await page.locator('#sidebar-toggle').click();await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(220);await page.screenshot({path:path.join(output,name+'.png'),fullPage:true,animations:'disabled'});}
 try {
  await open(urls.catalog);
  for(const grade of [4,5,6]){
   await open('aprende.html?grade='+grade);
   assert.equal(await page.locator('.course-card').count(),5);
   await page.locator('[data-filter="inProgress"]').click();
   assert.equal(await page.locator('.course-card').count(),grade===4?4:5);
   await page.locator('[data-filter="completed"]').click();
   assert(await page.locator('.empty-state').isVisible());
   await page.locator('[data-filter="offlineFilter"]').click();
   assert.equal(await page.locator('.course-card').count(),0);
   await page.locator('[data-filter="all"]').click();
   assert.equal(await page.locator('.course-card').count(),5);
  }
  const tree=await page.evaluate(async()=>{
   const {getCourses,getCourse}=await import('../js/services/course.service.js');
   const rows=[];
   for(const grade of [4,5,6])for(const item of await getCourses(grade)){
    const course=await getCourse(grade,item.id);
    rows.push({id:course.id,grade,units:course.units.map(unit=>({id:unit.id,lessons:unit.lessons.map(lesson=>({id:lesson.id,title:lesson.title,src:lesson.audio.src,answer:lesson.exercise.answer,progress:lesson.progress}))}))});
   }
   return rows;
  });
  assert.equal(tree.length,15);
  const lessons=tree.flatMap(course=>course.units.flatMap(unit=>unit.lessons));
  assert.equal(lessons.length,60);
  assert.equal(new Set(lessons.map(lesson=>lesson.id)).size,60);
  for(const lesson of lessons){
   const response=await context.request.get(new URL(lesson.src,student).href);
   assert.equal(response.status(),200,lesson.src);
   const buffer=await response.body();
   assert.equal(buffer.subarray(0,4).toString(),'RIFF');
   assert.equal(buffer.subarray(8,12).toString(),'WAVE');
   assert(buffer.length>16000,lesson.src+' too short');
   assert(buffer.subarray(1000).some(byte=>byte!==0),'silent resource');
  }
  console.log('Data: 15 courses, 15 units, 60 unique lessons and 60 real WAV resources OK');
  for(const id of ['math','reading','science','social','english']){
   await open('aprende.html?grade=5');
   await page.locator(`a[href*="course=${id}"]`).click();
   await page.waitForURL('**/curso.html?**');
   assert.equal(await page.locator('.unit-card').count(),1);
   await page.locator('.unit-card a').click();
   await page.waitForURL('**/unidad.html?**');
   assert.equal(await page.locator('.lesson-card').count(),4);
   await page.locator('.lesson-card a').first().click();
   await page.waitForURL('**/leccion.html?**');
   assert.equal(await page.locator('[role="tab"]').count(),4);
   assert.match(await page.locator('h1').innerText(),new RegExp(tree.find(row=>row.id===id&&row.grade===5).units[0].lessons[0].title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  await open(urls.course);
  await page.locator('#download-course').click();
  assert.match(await page.locator('#dashboard-dialog-content').innerText(),/No se ha almacenado/);
  await close();
  await open(urls.unit);
  await page.locator('[data-unit-review]').click();assert.equal(await page.locator('.review-list li').count(),4);await close();
  await page.locator('[data-related-practice]').click();await page.waitForURL('**/practica.html?**');
  await page.waitForFunction(()=>document.querySelector('#learning-main').getAttribute('aria-busy')==='false');
  assert.equal(await page.locator('.practice-card').count(),1);
  await open(urls.unit);
  await page.locator('[data-unit-assessment]').click();assert.match(await page.locator('#dashboard-dialog-content').innerText(),/No hay una evaluación autorizada/);await close();
  await open(urls.lesson);
  const firstTitle=await page.locator('h1').innerText();
  await page.locator('#tab-listen').click();
  await page.waitForFunction(()=>document.querySelector('#lesson-audio').readyState>=1);
  const duration=await page.locator('#lesson-audio').evaluate(audio=>audio.duration);
  assert(Number.isFinite(duration)&&duration>1);
  await page.locator('#lesson-audio').evaluate(audio=>audio.play());
  await page.waitForFunction(()=>document.querySelector('#lesson-audio').currentTime>0.25);
  assert.equal(await page.locator('#lesson-audio').evaluate(audio=>audio.paused),false);
  await page.locator('#audio-speed').selectOption('1.25');
  assert.equal(await page.locator('#lesson-audio').evaluate(audio=>audio.playbackRate),1.25);
  await page.locator('#lesson-audio').evaluate(audio=>{audio.volume=.4;});
  assert.equal(await page.locator('#lesson-audio').evaluate(audio=>audio.volume),.4);
  await capture('aprende-lesson-audio',1440);
  await page.locator('#tab-listen').press('ArrowRight');
  assert.equal(await page.locator('#tab-view').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#lesson-audio').evaluate(audio=>audio.paused),true);
  assert(await page.locator('#panel-view svg[role="img"]').isVisible());
  await page.locator('#tab-view').press('End');
  assert.equal(await page.locator('#tab-practice').getAttribute('aria-selected'),'true');
  await page.locator('.exercise-check').click();
  assert.match(await page.locator('#exercise-feedback').innerText(),/Elige una opción/);
  await page.locator('[name="answer"][value="1"]').check();
  await page.locator('.exercise-check').click();
  assert.equal(await page.locator('#exercise-feedback').getAttribute('data-correct'),'false');
  await page.locator('[name="answer"][value="0"]').check();
  await page.locator('.exercise-check').click();
  assert.equal(await page.locator('#exercise-feedback').getAttribute('data-correct'),'true');
  assert.equal(await page.locator('.lesson-progress progress').getAttribute('value'),'100');
  await page.locator('#help-button').click();
  for(const key of ['easy','steps','another','drawing','tutor']){
   await page.locator(`[data-help="${key}"]`).click();
   assert((await page.locator('#help-content').innerText()).length>10);
   if(key==='steps')assert.equal(await page.locator('#help-content li').count(),3);
   if(key==='drawing')assert(await page.locator('#help-content svg').isVisible());
   if(key==='tutor')assert.match(await page.locator('#help-content').innerText(),/no son respuestas generadas/);
  }
  await page.screenshot({path:path.join(output,'aprende-lesson-help.png'),animations:'disabled'});
  if(process.env.AXE_MODULE){
   const {default:AxeBuilder}=require(process.env.AXE_MODULE);
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(audit.violations.map(v=>v.id),[],'Help dialog accessibility');
  }
  await close();assert.equal(await page.evaluate(()=>document.activeElement.id),'help-button');
  await page.locator('#exercise-continue').click();
  await page.waitForURL('**/*lesson=math-g4-u1-l2');
  assert.notEqual(await page.locator('h1').innerText(),firstTitle);
  assert.match(await page.locator('#lesson-audio source').getAttribute('src'),/l2\.wav$/);
  assert.equal(await page.locator('.lesson-index [aria-current="page"]').count(),1);
  await page.locator('[data-next]').click();await page.waitForURL('**/*lesson=math-g4-u1-l3');
  await page.locator('[data-previous]').click();await page.waitForURL('**/*lesson=math-g4-u1-l2');
  await page.locator('.learning-breadcrumb a[href*="unidad.html"]').click();await page.waitForURL('**/unidad.html?**');
  await page.locator('.learning-breadcrumb a[href*="curso.html"]').click();await page.waitForURL('**/curso.html?**');
  await page.locator('.learning-breadcrumb a[href*="aprende.html"]').click();await page.waitForURL('**/aprende.html?**');
  console.log('UI: course/unit/lesson chain, breadcrumbs, audio playback, tabs, exercises, help and next/previous OK');
  for(const [name,url] of Object.entries(urls)){
   await open(url);
   assert.equal(new URL(await page.locator('.learning-breadcrumb a').first().getAttribute('href'),student).searchParams.get('grade'),'4');
   for(const width of [320,375,768,1024,1440,1920]){
    await page.setViewportSize({width,height:960});await page.waitForTimeout(200);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: ${width} overflow`);
   }
   if(name==='lesson'){
    await page.setViewportSize({width:320,height:960});
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.lesson-index').getAttribute('open'),null);
    await page.locator('.lesson-index summary').click();assert(await page.locator('.lesson-index nav').isVisible());
   }
   const broken=await page.evaluate(async()=>{
    const urls=[...document.querySelectorAll('a[href],link[href],script[src],img[src],source[src]')].map(el=>el.href||el.src).filter(url=>!url.includes('#'));
    return (await Promise.all(urls.map(async url=>[url,(await fetch(url)).status]))).filter(([,status])=>status!==200);
   });
   assert.deepEqual(broken,[]);
   for(const [suffix,width] of [['desktop',1440],['mobile',320]])await capture('aprende-'+name+'-'+suffix,width);
   if(process.env.AXE_MODULE){
    const {default:AxeBuilder}=require(process.env.AXE_MODULE);
    for(const width of [1440,320]){
     await page.setViewportSize({width,height:960});await page.waitForTimeout(220);
     const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
     if(audit.violations.length)console.log(JSON.stringify(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),null,2));
     assert.deepEqual(audit.violations.map(v=>v.id),[],name+' axe '+width);
    }
   }
  }
  for(const url of ['curso.html?course=unknown','curso.html?grade=8&course=math','curso.html?grade=4&grade=5&course=math','unidad.html?grade=4&course=reading&unit=math-g4-u1','leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=missing','leccion.html?course=%3Cscript%3E']){
   await open(url);assert.match(await page.locator('h1').innerText(),/Contenido no encontrado/);
   assert(await page.locator('.not-found a').isVisible());
  }
  await page.setViewportSize({width:1440,height:960});
  await open(urls.lesson);await page.locator('#language-select').selectOption('en');
  assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('#tab-listen').innerText(),'Listen');
  await page.locator('#student-sidebar [data-section="courses"]').click();await page.waitForURL('**/aprende.html?**');
  assert.match(await page.locator('h1').innerText(),/My courses/);
  await page.goto(student+'index.html?grade=5');await page.waitForFunction(()=>document.querySelector('#dashboard-main').getAttribute('aria-busy')==='false');
  await page.locator('#continue-learning .hero-button').click();await page.waitForURL('**/leccion.html?**');
  assert.match(await page.locator('h1').innerText(),/Relaciona fracciones y decimales/);
  await page.locator('#student-sidebar [data-section="home"]').click();await page.waitForURL('**/index.html?**');
  await page.locator('#student-sidebar [data-section="courses"]').click();await page.waitForURL('**/aprende.html?**');
  assert.deepEqual(await page.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);
  assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  console.log('Responsive: 4 screens × 6 widths, accessibility, invalid IDs, ES/EN and Dashboard integration OK');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
