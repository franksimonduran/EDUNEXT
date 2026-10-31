const CACHE_STATIC='aithron-static-v1';
const CACHE_CONTENT='aithron-content-v1';

export async function ensureCaches(){
 if(!('caches' in self)&&typeof caches==='undefined') return;
}
export async function cacheAsset(url){
 try {
  if(typeof caches==='undefined') return false;
  const cache=await caches.open(CACHE_CONTENT);
  const res=await fetch(url,{cache:'reload'});
  if(res.ok) await cache.put(url,res.clone());
  return res.ok;
 } catch{return false;}
}
export async function matchAsset(url){
 try {
  if(typeof caches==='undefined') return null;
  const c1=await caches.match(url);
  if(c1) return c1;
  const c2=await caches.open(CACHE_CONTENT);
  return await c2.match(url);
 } catch{return null;}
}
export async function clearContentCache(){
 try {
  if(typeof caches==='undefined') return;
  await caches.delete(CACHE_CONTENT);
 } catch{}
}
export {CACHE_STATIC,CACHE_CONTENT};
