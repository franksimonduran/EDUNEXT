// Client lifecycle simulation; not proof of server revocation or cross-tab safety.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../frontend/js/services/auth.service.js'),'utf8').replace("import { config } from '../core/config.js';","const config={apiBaseUrl:'https://api.example/api/v1',csrfHeaderName:'X-CSRF-Token'};");
const storage=new Map();
global.window={sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
const json=body=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
(async()=>{
 const api=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 global.fetch=async url=>url.endsWith('/auth/csrf')?json({csrf_token:'fictional-csrf'}):json({access_token:'fictional-access'});
 await api.refreshSession();
 let releaseRead;
 global.fetch=url=>url.endsWith('/private')?new Promise(resolve=>releaseRead=resolve):Promise.resolve(json({ok:true}));
 const read=api.apiRequest('/private');
 const rejects=assert.rejects(read,e=>e.code==='SESSION_CHANGED');
 await api.signOut();
 releaseRead(json({private:'must not reach stale view'}));await rejects;
 assert.equal(storage.has('aithron.access_token'),false);
 // Start a rotation, then logout before its response is received.
 let releaseRefresh,refreshes=0,revoked=false;
 global.fetch=async (url,options)=>{
  if(url.endsWith('/auth/csrf'))return json({csrf_token:'fictional-csrf'});
  if(url.endsWith('/auth/refresh')){
   refreshes++;
   if(refreshes===1)return new Promise(resolve=>releaseRefresh=resolve);
   return json({access_token:'fictional-final-token'});
  }
  if(url.endsWith('/auth/logout')){assert.equal(options.headers.Authorization,'Bearer fictional-final-token');revoked=true;return json({ok:true});}
  throw new Error('Unexpected fixture URL');
 };
 const rotating=api.refreshSession();
 // csrf bootstrap contains awaits; wait for the fixture to receive /refresh.
 while(!releaseRefresh)await new Promise(resolve=>setImmediate(resolve));
 const logout=api.signOut();
 releaseRefresh(json({access_token:'must-not-resurrect'}));
 await rotating;await logout;
 assert.equal(revoked,true);assert.equal(storage.has('aithron.access_token'),false);
 console.log('PASS phase48 client lifecycle: stale response rejected, pending refresh cannot restore access token after logout, revocation attempted. Simulated server only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
