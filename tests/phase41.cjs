const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const port=8141,base=`http://127.0.0.1:${port}`;
const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:require('node:path').join(__dirname,'../frontend'),stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(base+'/student/progreso.html')).ok)break;}catch{}await sleep(100);}
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let completed=false,denied=false,posts=0;
  await page.route('http://127.0.0.1:8000/api/v1/**',async route=>{
   const req=route.request();
   const headers={'access-control-allow-origin':base,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-credentials':'true','content-type':'application/json'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(denied)return route.fulfill({status:403,headers,body:JSON.stringify({detail:'Acceso denegado de prueba'})});
   if(req.method()==='POST'){posts++;assert.deepEqual(req.postDataJSON(),{lesson_version_id:'v1'});completed=true;return route.fulfill({status:200,headers,body:'{}'});}
   if(req.url().endsWith('/achievements'))return route.fulfill({status:200,headers,body:JSON.stringify([])});
   const course={course_id:'c1',title:'Curso <script>seguro</script>',applicable_lessons_count:1,completed_lessons_count:completed?1:0,completion_percentage:completed?100:0,lessons:[{lesson_id:'l1',lesson_version_id:'v1',title:'Lección de prueba',status:completed?'completed':'not_started'}]};
   return route.fulfill({status:200,headers,body:JSON.stringify({can_record_own_activity:true,active_courses_count:1,applicable_lessons_count:1,completed_lessons_count:completed?1:0,earned_achievements_count:0,completion_percentage:completed?100:0,courses:[course]})});
  });
  await page.goto(base+'/student/progreso.html?grade=4&modo=api');
  await page.getByRole('button',{name:'Marcar como revisada'}).waitFor();
  assert.equal(await page.locator('#learning-content script').count(),0);
  await page.getByRole('button',{name:'Marcar como revisada'}).click();
  await page.getByText('Revisión registrada en servidor.',{exact:true}).waitFor();
  assert.equal(posts,1);
  await page.reload();
  await page.getByText('Revisada (declaración del estudiante)',{exact:false}).waitFor();
  assert.equal(await page.locator('[data-complete-lesson]').count(),0);
  await page.setViewportSize({width:390,height:844});
  assert(await page.locator('#learning-content').isVisible());
  denied=true;
  await page.reload();
  await page.getByText('Acceso denegado de prueba',{exact:false}).waitFor();
  assert.equal(await page.locator('[data-complete-lesson]').count(),0);
  await page.goto(base+'/student/progreso.html?grade=4&modo=demo');
  await page.getByText('Mi progreso académico',{exact:true}).waitFor();
  assert.match(await page.locator('#learning-content').innerText(),/Datos de demostración/);
  assert.deepEqual(errors,[]);
  console.log('PASS fase 41: progreso API simulado, confirmación, recarga, XSS, 403 sin fallback, vista móvil y demo.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
