// Limited HTTP smoke test, loopback only. Never authenticates or mutates data.
const assert=require('node:assert/strict');
async function smoke(base){
 const url=new URL(base);
 if(!['http:','https:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash)throw new Error('Only an explicit loopback target is permitted');
 const results=[];
 for(const pathname of ['/login.html','/manifest.webmanifest','/sw.js','/api/v1/health/live','/api/v1/health/ready']){
  const response=await fetch(new URL(pathname,url),{signal:AbortSignal.timeout(8000),redirect:'error'});
  assert.equal(response.status,200,pathname+' not healthy');
  const body=await response.text();
  if(pathname.endsWith('/ready'))assert.equal(JSON.parse(body).status,'ready');
  if(pathname.endsWith('/live'))assert.equal(JSON.parse(body).status,'alive');
  if(pathname.endsWith('webmanifest'))assert.equal(JSON.parse(body).scope,'/');
  results.push({path:pathname,status:response.status});
 }
 return results;
}
module.exports={smoke};
if(require.main===module)smoke(process.argv[2]||'http://127.0.0.1:8080').then(r=>console.log(JSON.stringify(r,null,2))).catch(()=>{console.error('Smoke test failed; no deployment verified. Details/credentials withheld.');process.exitCode=1;});
