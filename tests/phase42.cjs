const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const port=8142,base=`http://127.0.0.1:${port}`;
const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:require('node:path').join(__dirname,'../frontend'),stdio:'ignore'});
(async()=>{
 let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(base+'/student/agenda.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let denied=false,posts=0,received=false;
  const teacherTasks=[];
  let submission={id:'s1',revision:1,status:'draft',response_text:'',submitted_at:null,feedback:[]};
  const task={id:'t1',title:'Lectura <script>inactiva</script>',instructions:'Lee y explica.',status:'published',availability:'available',allow_resubmission:false,effective_due_at:'2026-10-25T17:00:00-05:00',submission_id:null,submission_status:'not_started'};
  await page.route('http://127.0.0.1:8000/api/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');
   const headers={'access-control-allow-origin':base,'access-control-allow-headers':'authorization,content-type,idempotency-key','access-control-allow-methods':'GET,POST,PATCH,OPTIONS','access-control-allow-credentials':'true','content-type':'application/json'};
   const respond=(body,status=200)=>route.fulfill({status,headers,body:JSON.stringify(body)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(denied)return respond({detail:'Acceso denegado de prueba'},403);
   if(path==='/planner-context/me')return respond({items:[{course_id:'c1',classroom_id:'room1',academic_period_id:'p1',classroom_title:'Aula ficticia',course_title:'Lectura',period_title:'Periodo',timezone:'America/Lima'}],total:1});
   if(path==='/assignments'&&req.method()==='POST'){
    const data=req.postDataJSON();assert.equal(data.classroom_id,'room1');teacherTasks.push({...data,id:'teacher-task',status:'draft',revision:1});return respond(teacherTasks[0],201);
   }
   if(path==='/assignments')return respond({items:teacherTasks,total:teacherTasks.length});
   if(path==='/assignments/teacher-task/publish'){
    assert(req.headers()['idempotency-key']);teacherTasks[0].status='published';teacherTasks[0].revision=2;return respond({assignment:teacherTasks[0],assignment_version_id:'v1'});
   }
   if(path==='/assignments/me')return respond({items:[{...task,submission_id:received?'s1':null,submission_status:received?'submitted':'not_started'}],total:1});
   if(path==='/academic-calendar/me')return respond({items:[],total:0,timezone:'America/Lima'});
   if(path==='/planner-summary/me')return respond({pending_count:received?0:1,received_count:received?1:0,active_reinforcement_count:0});
   if(path==='/assignments/t1')return respond(task);
   if(path==='/assignments/t1/submissions'){assert(req.headers()['idempotency-key']);return respond(submission,201);}
   if(path==='/assignment-submissions/s1'&&req.method()==='PATCH'){
    submission={...submission,revision:submission.revision+1,response_text:req.postDataJSON().response_text};return respond(submission);
   }
   if(path==='/assignment-submissions/s1/submit'){
    assert(req.headers()['idempotency-key']);posts++;received=true;submission={...submission,status:'submitted',submitted_at:'2026-10-23T15:00:00Z',receipt:{confirmation_reference:'s1'}};return respond(submission);
   }
   if(path==='/assignment-submissions/s1')return respond(submission);
   return respond({detail:'Unexpected route '+path},404);
  });
  await page.goto(base+'/student/agenda.html?grade=4&modo=api');
  await page.getByRole('button',{name:'Abrir tarea'}).click();
  await page.getByLabel('Mi respuesta').fill('Mi explicación de la lectura.');
  await page.getByRole('button',{name:'Guardar borrador en servidor'}).click();
  await page.getByText('Borrador guardado en servidor.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Entregar',exact:true}).click();
  await page.getByText('Recibido por servidor:',{exact:false}).waitFor();
  assert.equal(posts,1);
  assert(await page.getByRole('button',{name:'Entregar',exact:true}).isDisabled());
  assert.equal(await page.locator('#learning-content script').count(),0);
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  await page.reload();await page.getByText('1 entregas recibidas',{exact:true}).waitFor();
  denied=true;await page.reload();await page.getByText('Acceso denegado de prueba',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Abrir tarea'}).count(),0);
  denied=false;
  await page.goto(base+'/monitor/tareas.html?modo=api');
  await page.getByLabel('Título',{exact:true}).fill('Lectura acompañada');
  await page.getByLabel('Instrucciones',{exact:true}).fill('Lee y explica con tus palabras.');
  await page.getByLabel('Disponible desde, ISO con zona horaria').fill('2026-10-23T08:00:00-05:00');
  await page.getByLabel('Fecha límite, ISO con zona horaria').fill('2026-10-25T17:00:00-05:00');
  await page.getByRole('button',{name:'Guardar borrador en servidor'}).click();
  await page.getByText('Borrador confirmado en servidor.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Publicar tarea',exact:true}).click();
  await page.getByText('Publicación confirmada en servidor.',{exact:true}).waitFor();
  assert.equal(teacherTasks.length,1);
  assert.equal(teacherTasks[0].status,'published');
  assert.deepEqual(errors,[]);
  console.log('PASS fase 42: API simulada; agenda, borrador, entrega, recibo, recarga, XSS, móvil, 403 sin fallback, creación y publicación docente.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
