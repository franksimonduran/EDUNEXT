const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');

const port=8127;
const base=`http://127.0.0.1:${port}/`;
const apiOrigin='http://127.0.0.1:8000';
const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:require('node:path').join(__dirname,'../frontend'),stdio:'ignore'});

const now='2026-02-01T12:00:00Z';
const year={id:'y1',name:'2026',year:2026,start_date:'2026-01-01',end_date:'2026-12-31',status:'active'};
const period={id:'p1',academic_year_id:'y1',name:'Bimestre 1',period_type:'bimester',start_date:'2026-01-01',end_date:'2026-03-31',status:'active',sequence:1};
const classrooms=[
 {id:'c1',code:'A-01',display_name:'Aula 1',grade_id:'g1',grade_name:'4to Primaria',section_name:'A',academic_year_id:'y1',status:'active',capacity:20},
 {id:'c2',code:'A-02',display_name:'Aula 2',grade_id:'g1',grade_name:'4to Primaria',section_name:'A',academic_year_id:'y1',status:'active',capacity:25},
];
const state={
 enrollments:[
  {id:'e1',student_id:'s1',institution_id:'i1',classroom_id:'c1',academic_year_id:'y1',period_id:'p1',status:'active',enrolled_at:now,effective_date:now,ended_at:null,status_reason:null,student_code:'EST-001',student_display_name:'Ana Perez',classroom_code:'A-01',classroom_name:'Aula 1',grade_name:'4to Primaria',section_name:'A',created_at:now,updated_at:now,movements:[{id:'m1',movement_type:'enrollment',effective_date:now,reason_code:'other',notes:null}]},
  {id:'e3',student_id:'s3',institution_id:'i1',classroom_id:'c2',academic_year_id:'y1',period_id:'p1',status:'pending',enrolled_at:now,effective_date:now,ended_at:null,status_reason:null,student_code:'EST-003',student_display_name:'Luis Gomez',classroom_code:'A-02',classroom_name:'Aula 2',grade_name:'4to Primaria',section_name:'A',created_at:now,updated_at:now,movements:[{id:'m3',movement_type:'enrollment',effective_date:now,reason_code:'other',notes:null}]},
 ],
};

const pageOf=items=>({items,total:items.length,page:1,page_size:100,pages:Math.max(1,Math.ceil(items.length/100))});
const publicEnrollment=item=>{const {movements,...rest}=item;return rest;};
const cors={'access-control-allow-origin':base.slice(0,-1),'access-control-allow-credentials':'true','content-type':'application/json'};

function compatible(item,url){
 const status=url.searchParams.get('status');
 const search=(url.searchParams.get('search')||'').toLowerCase();
 const yearId=url.searchParams.get('academic_year_id');
 const classroomId=url.searchParams.get('classroom_id');
 if(status&&item.status!==status)return false;
 if(yearId&&item.academic_year_id!==yearId)return false;
 if(classroomId&&item.classroom_id!==classroomId)return false;
 if(search&&![item.student_display_name,item.student_code,item.classroom_code,item.classroom_name].join(' ').toLowerCase().includes(search))return false;
 return true;
}

function transfer(body){
 const source=state.enrollments.find(item=>item.id==='e1');
 source.status='transferred';
 source.ended_at=now;
 source.status_reason='family_request';
 source.movements.push({id:'m-transfer',movement_type:'transfer',effective_date:now,reason_code:'family_request',notes:null});
 const destination={...source,id:'e2',classroom_id:body.destination_classroom_id,status:'active',ended_at:null,status_reason:null,classroom_code:'A-02',classroom_name:'Aula 2',created_at:now,updated_at:now,movements:[{id:'m2',movement_type:'transfer',effective_date:now,reason_code:'family_request',notes:null}]};
 state.enrollments.unshift(destination);
 return publicEnrollment(destination);
}

(async()=>{let browser;try{
 await new Promise(resolve=>setTimeout(resolve,1000));
 browser=await chromium.launch();
 const context=await browser.newContext();
 const page=await context.newPage();
 const errors=[],apiCalls=[];
 let forceUnauthorized=false;
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400&&!response.url().includes('/api/'))errors.push(response.status()+' '+response.url());});
 await page.addInitScript(()=>sessionStorage.setItem('aithron.access_token','phase37-token'));
 await page.route(`${apiOrigin}/api/v1/**`,async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{...cors,'access-control-allow-methods':'GET,POST,PATCH,OPTIONS','access-control-allow-headers':'authorization,content-type,x-csrf-token,idempotency-key'}});
  apiCalls.push({method:request.method(),path,search:url.search,headers:request.headers(),body:request.postData()});
  if(forceUnauthorized&&(path.endsWith('/enrollments')||path.endsWith('/auth/csrf')||path.endsWith('/auth/refresh')))return route.fulfill({status:401,headers:cors,body:JSON.stringify({detail:'No autenticado',code:'UNAUTHORIZED'})});
  let body,status=200;
  if(path.endsWith('/academic-years'))body=pageOf([year]);
  else if(path.endsWith('/academic-periods'))body=pageOf([period]);
  else if(/\/classrooms\/[^/]+$/.test(path)){
   const id=path.split('/').pop();
   body=classrooms.find(item=>item.id===id);
  } else if(path.endsWith('/classrooms'))body=pageOf(classrooms);
  else if(path.endsWith('/enrollments')&&request.method()==='GET')body=pageOf(state.enrollments.filter(item=>compatible(item,url)).map(publicEnrollment));
  else if(/\/enrollments\/[^/]+$/.test(path)){
   const id=path.split('/').pop(),item=state.enrollments.find(enrollment=>enrollment.id===id);
   if(!item){status=404;body={detail:'Enrollment not found',code:'NOT_FOUND'};}
   else body={...publicEnrollment(item),movements:item.movements||[]};
  } else if(path.endsWith('/withdraw')){
   const id=path.split('/').slice(-2)[0],item=state.enrollments.find(enrollment=>enrollment.id===id),data=JSON.parse(request.postData()||'{}');
   item.status='withdrawn';item.ended_at=now;item.status_reason=data.reason_code;
   item.movements.push({id:'m-withdraw',movement_type:'withdrawal',effective_date:now,reason_code:data.reason_code,notes:data.notes||null});
   body=publicEnrollment(item);
  } else if(path.endsWith('/complete')){
   const id=path.split('/').slice(-2)[0],item=state.enrollments.find(enrollment=>enrollment.id===id),data=JSON.parse(request.postData()||'{}');
   item.status='completed';item.ended_at=now;item.status_reason=data.reason_code;
   item.movements.push({id:'m-complete',movement_type:'completion',effective_date:now,reason_code:data.reason_code,notes:data.notes||null});
   body=publicEnrollment(item);
  } else if(path.endsWith('/transfer')){
   body=transfer(JSON.parse(request.postData()||'{}'));
  } else {status=404;body={detail:'Not found',code:'NOT_FOUND'};}
  return route.fulfill({status,headers:cors,body:JSON.stringify(body)});
 });

 await page.goto(base+'admin/matriculas.html');
 await page.waitForSelector('#admin-content[aria-busy="false"]');
 await page.waitForSelector('#enrollment-table');
 assert.match(await page.locator('#admin-network').innerText(),/API institucional conectada/);
 assert.equal(await page.locator('.demo-label').isHidden(),true);
 assert.deepEqual(await page.locator('.directory-summary strong').allTextContents(),['2','1','1','1 / 1']);
 assert.equal(await page.locator('#enrollment-table tbody tr').count(),2);

 await page.fill('#search','Ana');
 await page.selectOption('#status','active');
 const filtered=page.waitForResponse(response=>response.url().includes('/enrollments?')&&response.url().includes('search=Ana')&&response.url().includes('status=active'));
 await page.click('#live-enrollment-filters button[type="submit"]');
 await filtered;
 await page.waitForFunction(()=>document.querySelectorAll('#enrollment-table tbody tr').length===1);
 assert.match(await page.locator('#enrollment-table tbody').innerText(),/Ana Perez/);
 await page.click('#live-enrollment-filters button[type="reset"]');
 await page.waitForFunction(()=>document.querySelectorAll('#enrollment-table tbody tr').length===2);

 const anaRow=page.locator('#enrollment-table tbody tr').filter({hasText:'Ana Perez'});
 await anaRow.getByRole('button',{name:'Ver detalle'}).click();
 await page.waitForFunction(()=>document.querySelector('#admin-dialog').open);
 assert.match(await page.locator('#admin-dialog').innerText(),/Historial de movimientos/);
 assert.match(await page.locator('#admin-dialog').innerText(),/Matrícula/);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.querySelector('#admin-dialog').open);

 const transferResponse=page.waitForResponse(response=>response.url().endsWith('/enrollments/e1/transfer')&&response.request().method()==='POST');
 await anaRow.getByRole('button',{name:'Trasladar'}).click();
 await page.waitForSelector('[name="destination_classroom_id"]');
 assert.match(await page.locator('[name="destination_classroom_id"]').innerText(),/Aula 2/);
 await page.selectOption('[name="destination_classroom_id"]','c2');
 await page.selectOption('[name="reason_code"]','family_request');
 await page.locator('form[data-live-action="transfer"] button[type="submit"]').click();
 await transferResponse;
 await page.waitForFunction(()=>document.querySelectorAll('#enrollment-table tbody tr').length===3);
 assert.match(await page.locator('#enrollment-table tbody').innerText(),/Trasladada/);
 assert.match(await page.locator('#org-message').innerText(),/Traslado registrado/);

 const completeResponse=page.waitForResponse(response=>response.url().endsWith('/enrollments/e2/complete')&&response.request().method()==='POST');
 await page.click('button[data-live-complete="e2"]');
 await page.waitForSelector('form[data-live-action="complete"]');
 await page.selectOption('[name="reason_code"]','year_end');
 await page.locator('form[data-live-action="complete"] button[type="submit"]').click();
 await completeResponse;
 await page.waitForFunction(()=>document.querySelector('#enrollment-table tbody').textContent.includes('Culminada'));

 const luisRow=page.locator('#enrollment-table tbody tr').filter({hasText:'Luis Gomez'});
 const withdrawResponse=page.waitForResponse(response=>response.url().endsWith('/enrollments/e3/withdraw')&&response.request().method()==='POST');
 await luisRow.getByRole('button',{name:'Retirar'}).click();
 await page.waitForSelector('form[data-live-action="withdraw"]');
 await page.selectOption('[name="reason_code"]','family_request');
 await page.fill('[name="notes"]','Retiro solicitado por la familia');
 await page.locator('form[data-live-action="withdraw"] button[type="submit"]').click();
 await withdrawResponse;
 await page.waitForFunction(()=>document.querySelector('#enrollment-table tbody').textContent.includes('Retirada'));
 assert.match(await page.locator('#org-message').innerText(),/Retiro registrado/);
 const transferCall=apiCalls.find(call=>call.method==='POST'&&call.path.endsWith('/e1/transfer'));
 const completeCall=apiCalls.find(call=>call.method==='POST'&&call.path.endsWith('/e2/complete'));
 const withdrawCall=apiCalls.find(call=>call.method==='POST'&&call.path.endsWith('/e3/withdraw'));
 assert(transferCall.headers['idempotency-key']);
 assert.equal(JSON.parse(transferCall.body).destination_classroom_id,'c2');
 assert.equal(JSON.parse(completeCall.body).reason_code,'year_end');
 assert.equal(JSON.parse(withdrawCall.body).reason_code,'family_request');
 assert.match(JSON.parse(withdrawCall.body).notes,/familia/);

 for(const width of [1440,768,320]){
  await page.setViewportSize({width,height:1000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'live overflow '+width);
 }
 await page.setViewportSize({width:1440,height:1000});

 await page.goto(base+'admin/matriculas.html?modo=demo');
 await page.waitForSelector('#admin-content[aria-busy="false"]');
 await page.waitForSelector('#enrollment-table');
 assert.match(await page.locator('#admin-content').innerText(),/Relaciones base/);
 assert.equal(await page.locator('.demo-label').isVisible(),true);
 assert.match(await page.locator('#enrollment-table caption').innerText(),/demostración/);
 assert.equal(await page.locator('#live-enrollment-filters').count(),0);

 forceUnauthorized=true;
 await page.evaluate(()=>sessionStorage.clear());
 await page.goto(base+'admin/matriculas.html');
 await page.waitForSelector('#admin-content[aria-busy="false"]');
 await page.waitForSelector('#enrollment-table');
 assert.equal(await page.locator('.demo-label').isVisible(),true);
 assert.match(await page.locator('#admin-content').innerText(),/sesión administrativa válida/);
 forceUnauthorized=false;
 for(let index=errors.length-1;index>=0;index--)if(/status of 401/.test(errors[index]))errors.splice(index,1);

 assert.deepEqual(errors,[]);
 console.log('PASS fase 37: matrículas desde API, filtros y paginación, detalle, traslado, culminación, retiro, responsive y modo demostración.');
}finally{if(browser)await browser.close();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
