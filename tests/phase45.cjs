const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const port=8145,base=`http://127.0.0.1:${port}`;
const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:require('node:path').join(__dirname,'../frontend'),stdio:'ignore'});
(async()=>{
 let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(base+'/student/tutor.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.__microphoneRequests=0;if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{window.__microphoneRequests++;throw new DOMException('Denied','NotAllowedError');};});
  let available=false,denied=false,tutorCalls=0,translationCalls=0;
  let config={revision:0,tutor_enabled:false,translation_enabled:false,dictionary_enabled:true,provider_approved:false,daily_user_limit:20,daily_institution_limit:200,max_input_characters:1000,max_output_tokens:256,can_manage:true,provider:null,operator_enabled:false};
  const lesson='11111111-1111-4111-8111-111111111111';
  const entry={id:'es-en-libro',from:'es',to:'en',word:'Libro',translation:'Book',example:'El libro es azul.',exampleTranslation:'The book is blue.',category:'noun',topic:'Lectura',origin:'project_local_dictionary',license_status:'Project-authored examples; no third-party dataset imported',generated_by_ai:false};
  await page.route('http://127.0.0.1:8000/api/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');
   const headers={'access-control-allow-origin':base,'access-control-allow-headers':'authorization,content-type,idempotency-key','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-credentials':'true','content-type':'application/json'};
   const respond=(body,status=200)=>route.fulfill({status,headers,body:JSON.stringify(body)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(denied)return respond({detail:'Acceso denegado de prueba'},403);
   if(path==='/ai/configuration'&&req.method()==='PATCH'){
    const body=req.postDataJSON();assert.equal(body.expected_revision,config.revision);assert(!('model' in body));config={...config,...body,revision:config.revision+1};return respond(config);
   }
   if(path==='/ai/configuration')return respond(config);
   if(path==='/ai/usage/institution')return respond({requests:null,data_status:'suppressed_small_cohort',estimated_cost:null});
   if(path==='/ai/capabilities')return respond({capabilities:[{service:'tutor',state:available?'available':'disabled'},{service:'translation',state:available?'available':'disabled'},{service:'dictionary',state:'available'},{service:'speech_recognition',state:'provider_not_configured'}]});
   if(path==='/ai/tutor/contexts')return respond({items:[{lesson_id:lesson,version_id:'v1',course_id:'c1',title:'Fracciones publicadas'}]});
   if(path==='/ai/tutor/messages'){
    tutorCalls++;assert(req.headers()['idempotency-key']);assert.deepEqual(Object.keys(req.postDataJSON()).sort(),['action','lesson_id','text']);
    return respond({service:'tutor',text:'Explicación <script>inactiva</script>',warning:'Respuesta de prueba no validada por docente.',origin:'local_model',sources:[{lesson_id:lesson,version_id:'v1',course_id:'c1',title:'Fracciones publicadas'}]});
   }
   if(path==='/ai/translate'){translationCalls++;assert(req.headers()['idempotency-key']);return respond({text:'The book is blue.',origin:'local_model',warning:'Traducción generada de prueba.'});}
   if(path==='/ai/dictionary/search')return respond({items:[entry],total:1,origin:'project_local_dictionary'});
   if(path==='/ai/pronunciation/references')return respond({items:[entry],total:1});
   if(path==='/ai/pronunciation/references/es-en-libro')return respond(entry);
   if(path==='/ai/pronunciation/sessions')return respond({id:'reference-session',status:'reference_only',transcription:null,phonetic_score:null},201);
   return respond({detail:'Unexpected route '+path},404);
  });
  await page.goto(base+'/student/tutor.html?modo=api');
  await page.locator('#tutor-question').waitFor();assert(await page.locator('#tutor-send').isDisabled());assert.equal(tutorCalls,0);
  available=true;await page.reload();
  await page.locator('#tutor-question').fill('Explícame una fracción.');await page.locator('#tutor-send').click();
  await page.getByText('Explicación <script>inactiva</script>',{exact:true}).waitFor();
  assert.equal(await page.locator('#learning-content script').count(),0);assert.equal(tutorCalls,1);
  available=false;await page.goto(base+'/student/traductor.html?modo=api');
  await page.locator('#source-input').fill('Libro');assert(await page.locator('#do-translate').isDisabled());
  await page.getByRole('button',{name:'Buscar en diccionario local'}).click();await page.getByRole('heading',{name:'Libro — Book',exact:true}).waitFor();assert.equal(translationCalls,0);
  available=true;await page.reload();await page.locator('#source-input').fill('El libro es azul.');await page.locator('#do-translate').click();await page.getByText('The book is blue.',{exact:true}).waitFor();assert.equal(translationCalls,1);
  await page.goto(base+'/student/pronuncia.html?modo=api');await page.getByRole('link',{name:'Practicar',exact:true}).click();
  await page.getByRole('button',{name:'Registrar sesión de referencia'}).click();await page.getByText('Sesión de referencia registrada:',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>window.__microphoneRequests),0);
  assert.equal(await page.locator('[data-mic-toggle]').count(),0);
  denied=true;await page.reload();await page.getByText('Acceso denegado de prueba',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Registrar sesión de referencia'}).count(),0);
  denied=false;await page.goto(base+'/admin/estado-servicios.html?modo=api');
  await page.getByLabel('Permitir Tutor',{exact:true}).check();
  await page.getByRole('button',{name:'Guardar política en servidor'}).click();
  await page.getByText('Política guardada en servidor, revisión 1.',{exact:false}).waitFor();
  assert.equal(config.tutor_enabled,true);assert.equal(config.operator_enabled,false);
  await page.goto(base+'/student/tutor.html?modo=demo');await page.locator('#tutor-question').waitFor();assert.match(await page.locator('#tutor-mode').innerText(),/demo/i);
  assert.deepEqual(errors,[]);
  console.log('PASS fase 45: API simulada; disponibilidad diferenciada, Tutor, XSS, diccionario, traducción, referencia sin micrófono, 403, política institucional y demo. No acredita proveedor real.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
