export function initServiceWorker(){
 if(!('serviceWorker' in navigator)) return Promise.resolve(null);
 const base=new URL('../../',import.meta.url);
 return navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname}).then(reg=>reg).catch(()=>null);
}
export function checkUpdate(){
 if(!('serviceWorker' in navigator)) return;
 navigator.serviceWorker.getRegistration().then(reg=>{
  if(reg) reg.update().catch(()=>{});
 });
}
export function listenSW(cb){
 if(!('serviceWorker' in navigator)) return;
 navigator.serviceWorker.addEventListener('message', e=>{ if(cb) cb(e.data); });
}
