// Small loopback HTTP fixture. This is not FastAPI load/performance evidence.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sockets=new Set();
const server=http.createServer((req,res)=>{
  if(req.url.endsWith('/slow')){res.writeHead(200,{'Content-Type':'application/json'});res.write('{');return;}
  if(req.url.endsWith('/forbidden')){res.writeHead(403,{'Content-Type':'application/json','X-Request-ID':'fixture-403'});return res.end('{"detail":"Forbidden fixture"}');}
  res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');
});
server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 global.window={sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}};
 const source=fs.readFileSync(path.join(__dirname,'../frontend/js/services/auth.service.js'),'utf8').replace("import { config } from '../core/config.js';",`const config={apiBaseUrl:${JSON.stringify(base)},csrfHeaderName:'X-CSRF-Token'};`);
 const api=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.deepEqual(await api.apiRequest('/ok',{auth:false}),{ok:true});
 await assert.rejects(api.apiRequest('/slow',{auth:false,timeoutMs:80}),e=>e.code==='TIMEOUT');
 const controller=new AbortController();
 const request=api.apiRequest('/slow',{auth:false,signal:controller.signal});
 setTimeout(()=>controller.abort(),40);
 await assert.rejects(request,e=>e.name==='AbortError');
 await assert.rejects(api.apiRequest('/forbidden',{auth:false}),e=>e.status===403 && e.requestId==='fixture-403');
 assert.throws(()=>api.apiDownload('//invalid'),TypeError);
 console.log('PASS phase48 loopback HTTP: JSON, slow-body timeout, cancellation, 403/request ID, download path validation. Not FastAPI/PostgreSQL/E2E.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{for(const socket of sockets)socket.destroy();server.close();});
