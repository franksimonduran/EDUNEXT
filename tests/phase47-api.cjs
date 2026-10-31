// Contract tests with a fake transport, NOT end-to-end or PostgreSQL evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../frontend/js/services/auth.service.js'), 'utf8')
  .replace("import { config } from '../core/config.js';", "const config = {apiBaseUrl:'https://api.example/api/v1',csrfHeaderName:'X-CSRF-Token'};");
const storage = new Map();
global.window = { sessionStorage: {getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)} };
const json = (body, status=200, headers={}) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json',...headers}});
(async()=>{
  const api = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  let refreshes=0;
  global.fetch = async (url, options) => {
    if(url.endsWith('/auth/csrf')) return json({csrf_token:'csrf-test'});
    if(url.endsWith('/auth/refresh')) {refreshes++; await new Promise(r=>setTimeout(r,10)); assert.equal(options.headers['X-CSRF-Token'],'csrf-test');return json({access_token:'test-token'});}
    return json({ok:true});
  };
  await Promise.all(Array.from({length:10},()=>api.refreshSession()));
  assert.equal(refreshes,1);
  let initial=0, retried=0;
  global.fetch=async (url,options)=>{
    if(url.endsWith('/auth/refresh')) {refreshes++;await new Promise(r=>setTimeout(r,10));return json({access_token:'rotated-test-token'});}
    if(options.headers.Authorization==='Bearer rotated-test-token'){retried++;return json({ok:true});}
    initial++;return json({detail:'Expired'},401);
  };
  await Promise.all(Array.from({length:10},()=>api.apiRequest('/protected')));
  assert.equal(initial,10);assert.equal(retried,10);assert.equal(refreshes,2);
  for(const status of [400,401,403,404,409,422,429,500,503]){
    global.fetch=async()=>json({detail:status===422?[{loc:['body','title'],msg:'Required'}]:undefined},status,{'Retry-After':'30'});
    await assert.rejects(api.apiRequest('/test',{retry:false}),e=>e.status===status && e.retryAfter==='30' && (status!==422 || e.fields.length===1));
  }
  assert.throws(()=>api.apiRequest('//evil.example'),TypeError);
  global.fetch=async()=>{throw new TypeError('network');};
  await assert.rejects(api.apiRequest('/test'),e=>e.name==='AuthenticationUnavailableError');
  global.fetch=(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
  await assert.rejects(api.apiRequest('/test',{timeoutMs:5}),e=>e.code==='TIMEOUT');
  global.fetch=async url=>url.endsWith('/auth/login')?json({access_token:'test-token'}):json({detail:'Denied'},403);
  await assert.rejects(api.signIn({identifier:'fictional',password:'fictional'}),e=>e.status===403);
  const configuration=fs.readFileSync(path.join(__dirname,'../frontend/js/core/config.js'),'utf8');
  const loadConfig=suffix=>import('data:text/javascript;base64,'+Buffer.from(configuration+'\n//'+suffix).toString('base64'));
  assert.equal((await loadConfig('default')).config.apiBaseUrl,'/api/v1');
  global.AITHRON_CONFIG={apiBaseUrl:'https://api.example/api/v1/'};
  assert.equal((await loadConfig('override')).config.apiBaseUrl,'https://api.example/api/v1');
  delete global.AITHRON_CONFIG;
  console.log('PASS phase47: refresh single-flight, HTTP errors, validation, network, timeout, path rejection, login fails closed. Fake transport only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
