const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const port=8143,base=`http://127.0.0.1:${port}`;
const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:require('node:path').join(__dirname,'../frontend'),stdio:'ignore'});
(async()=>{
 let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(base+'/student/progreso.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let scope='me',denied=false,suppressed=true;
  const entry=()=>({code:scope==='me'?'me.courses':scope==='monitor'?'monitor.classrooms':'institution.enrollments',name:'Reporte autorizado',version:1,filters:scope==='institution'?['academic_year_id','cutoff']:scope==='monitor'?['classroom_id','course_id','academic_period_id']:[],export_formats:['csv']});
  await page.route('http://127.0.0.1:8000/api/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');
   const headers={'access-control-allow-origin':base,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-credentials':'true','content-type':'application/json'};
   const respond=(body,status=200)=>route.fulfill({status,headers,body:JSON.stringify(body)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(denied)return respond({detail:'Acceso denegado de prueba'},403);
   if(path==='/reports/catalog')return respond([entry()]);
   if(path==='/reports/monitor/context')return respond({items:[{classroom_id:'room1',course_id:'c1',academic_period_id:'p1',classroom_title:'Aula ficticia',course_title:'Lectura',period_title:'Periodo'}]});
   if(path==='/reports/institution/context')return respond({items:[{id:'year1',name:'Año ficticio'}]});
   if(path==='/reports/exports'){
    assert.equal(req.postDataJSON().report_code,entry().code);
    return route.fulfill({status:200,headers:{...headers,'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="report.csv"'},body:'\ufeffAITHRON EDU — no oficial\r\nvalue\r\n1\r\n'});
   }
   if(path.startsWith('/reports/')){
    const privacy=scope==='institution'&&suppressed;
    if(scope==='monitor'){assert.equal(url.searchParams.get('classroom_id'),'room1');assert.equal(url.searchParams.get('course_id'),'c1');}
    return respond({metadata:{report_id:entry().code,definition_version:1,institution_id:'inst1',generated_at:'2026-10-23T12:00:00Z',timezone:'America/Lima',filters:Object.fromEntries(url.searchParams),population_definition:'Población autorizada ficticia',data_status:privacy?'suppressed_small_cohort':'calculated_from_server_records',sources:['Fuente de prueba'],limitations:privacy?['Distribución y totales suprimidos.']:[]},metrics:privacy?[{id:'unique_students_count',value:null,unit:'students',denominator:null}]:[],rows:privacy?[]:[{title:'Lectura <script>inactiva</script>',completion_percentage:50}],columns:['title','completion_percentage'],total:privacy?null:2,page:Number(url.searchParams.get('page')||1),page_size:1,definitions:{completion_percentage:{formula:'completadas / aplicables'}}});
   }
   return respond({detail:'Unexpected route'},404);
  });
  await page.goto(base+'/student/progreso.html?modo=api&vista=reportes');
  await page.getByRole('button',{name:'Consultar reporte',exact:true}).click();
  await page.getByRole('cell',{name:'Lectura <script>inactiva</script>',exact:true}).waitFor();
  assert.equal(await page.locator('#learning-content script').count(),0);
  await page.getByRole('button',{name:'Siguiente',exact:true}).click();
  await page.getByText('Página 2',{exact:true}).waitFor();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar CSV autorizado'}).click();
  const download=await downloadPromise,stream=await download.createReadStream();let content='';for await(const chunk of stream)content+=chunk.toString();
  assert.match(content,/no oficial/);
  denied=true;await page.getByRole('button',{name:'Consultar reporte',exact:true}).click();
  await page.getByText('Reporte no disponible:',{exact:false}).waitFor();
  assert.equal(await page.locator('#learning-content table').count(),0);
  denied=false;scope='monitor';
  await page.goto(base+'/monitor/reportes.html?modo=api');
  await page.getByRole('button',{name:'Consultar reporte',exact:true}).click();
  await page.getByRole('cell',{name:'Lectura <script>inactiva</script>',exact:true}).waitFor();
  scope='institution';
  await page.goto(base+'/admin/reportes.html?modo=api');
  await page.getByRole('button',{name:'Consultar reporte',exact:true}).click();
  await page.getByText('Datos suprimidos por privacidad de grupos pequeños',{exact:true}).first().waitFor();
  assert.equal(await page.locator('#admin-content table').count(),0);
  assert.match(await page.locator('#admin-content').innerText(),/No disponible/);
  assert.deepEqual(errors,[]);
  console.log('PASS fase 43: API simulada; tres perfiles, contextos, tabla accesible, medidor, paginación, CSV descargado, 403 sin datos antiguos, XSS y supresión.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
