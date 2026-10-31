export async function checkServiceWorker(){
  if(!('serviceWorker' in navigator)){
    return {supported:false,registered:false,active:false,controlling:false,scope:null};
  }
  
  const reg=await navigator.serviceWorker.getRegistration();
  if(!reg){
    return {supported:true,registered:false,active:false,controlling:false,scope:null};
  }
  
  return {
    supported:true,
    registered:true,
    active:!!reg.active,
    controlling:!!navigator.serviceWorker.controller,
    scope:reg.scope,
    updateViaCache:reg.updateViaCache,
  };
}

export async function registerServiceWorker(scriptURL='/sw.js',scope='/'){
  if(!('serviceWorker' in navigator)) return {ok:false,error:'SW no soportado'};
  try{
    const reg=await navigator.serviceWorker.register(scriptURL,{scope});
    return {ok:true,registration:reg};
  }catch(e){
    return {ok:false,error:e.message};
  }
}

export function onServiceWorkerUpdate(cb){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>cb());
}

export function onServiceWorkerMessage(cb){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message',e=>cb(e.data));
}

export async function unregisterServiceWorker(){
  const reg=await navigator.serviceWorker.getRegistration();
  if(reg){
    await reg.unregister();
    return {ok:true};
  }
  return {ok:false,error:'No registration found'};
}

export async function checkSWUpdate(){
  const reg=await navigator.serviceWorker.getRegistration();
  if(reg) await reg.update();
}