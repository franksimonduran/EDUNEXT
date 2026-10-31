// Disposable loopback API fixture only; never starts the application or a DB.
const http=require('node:http'),assert=require('node:assert/strict');
const {createDevServer}=require('../tools/dev-server.cjs');
const {saveFinalEvidence}=require('../tools/final-evidence.cjs');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
const close=server=>new Promise(resolve=>server.close(resolve));
(async()=>{
 const upstream=http.createServer((req,res)=>{let text='';req.on('data',chunk=>text+=chunk);req.on('end',()=>{res.writeHead(req.url.includes('contexts')?401:200,{'Content-Type':'application/json','Set-Cookie':['fixture=synthetic; HttpOnly; SameSite=Lax; Path=/api/v1']});res.end(JSON.stringify({path:req.url,method:req.method,body:text,csrf:req.headers['x-csrf-token'],cookie:req.headers.cookie,authorization:req.headers.authorization}));});});
 const apiPort=await listen(upstream),server=createDevServer({apiPort}),port=await listen(server),base=`http://127.0.0.1:${port}`;
 try{
  const page=await fetch(base+'/student/tutor.html');assert.equal(page.status,200);assert((await page.text()).includes('tutor.js'));
  const response=await fetch(base+'/api/v1/ai/capabilities',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':'synthetic-csrf','Cookie':'fixture=synthetic','Authorization':'Bearer synthetic'},body:'{"synthetic":true}'});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert(response.headers.get('set-cookie').includes('HttpOnly'));
  const data=await response.json();assert.equal(data.path,'/api/v1/ai/capabilities');assert.equal(data.csrf,'synthetic-csrf');assert.equal(data.cookie,'fixture=synthetic');assert.equal(data.authorization,'Bearer synthetic');assert.equal(data.body,'{"synthetic":true}');
  assert.equal((await fetch(base+'/api/v1/ai/tutor/contexts')).status,401);
  const rejectedHost=await new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port,path:'/api/v1/ai/capabilities',headers:{Host:'untrusted.invalid'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));}).on('error',reject);});
  assert.equal(rejectedHost,400);
  await close(upstream);
  assert.equal((await fetch(base+'/api/v1/ai/capabilities')).status,503);
  const report={date:new Date().toISOString(),pass:true,checks:['Static tutor page','API method/path/body and auth/CSRF forwarded','Cookie and error status preserved','Untrusted Host rejected','Missing backend returns 503 instead of static 404'],scope:'Synthetic HTTP fixture; not FastAPI, PostgreSQL, real authentication or Gemini.'};
  if(process.env.AITHRON_FINAL_VALIDATION==='1')saveFinalEvidence('DEV_PROXY.json',report);
  console.log(JSON.stringify(report,null,2));
 }finally{await close(server);if(upstream.listening)await close(upstream);}
})().catch(error=>{console.error(error);process.exitCode=1;});
