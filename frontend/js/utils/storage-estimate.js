export async function getStorageEstimate(){
  if(!('storage' in navigator && 'estimate' in navigator.storage)){
    return {supported:false,usage:0,quota:0,usedMB:'0',quotaMB:'0',percentUsed:'?'};
  }
  const est=await navigator.storage.estimate();
  return {
    supported:true,
    usage:est.usage||0,
    quota:est.quota||0,
    usedMB:((est.usage||0)/1024/1024).toFixed(2),
    quotaMB:((est.quota||0)/1024/1024).toFixed(2),
    percentUsed:est.quota?((est.usage/est.quota)*100).toFixed(1):'?',
    raw:est,
  };
}

export async function getPersistenceStatus(){
  if(!('storage' in navigator && 'persisted' in navigator.storage)){
    return {supported:false,persisted:false};
  }
  const persisted=await navigator.storage.persisted();
  return {supported:true,persisted};
}

export async function requestPersistence(){
  if(!('storage' in navigator && 'persist' in navigator.storage)){
    return {ok:false,reason:'API no disponible'};
  }
  try{
    const granted=await navigator.storage.persist();
    return {ok:true,granted};
  }catch(e){
    return {ok:false,reason:e.message};
  }
}

export function formatBytes(bytes){
  if(bytes<1024) return bytes+' B';
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB';
  if(bytes<1024*1024*1024) return (bytes/1024/1024).toFixed(2)+' MB';
  return (bytes/1024/1024/1024).toFixed(2)+' GB';
}

export function formatPercent(value,total){
  if(!total) return '0%';
  return ((value/total)*100).toFixed(1)+'%';
}

export function getStorageWarningLevel(percentUsed){
  if(percentUsed>='90') return {level:'critical',message:'Almacenamiento casi lleno'};
  if(percentUsed>='75') return {level:'warning',message:'Almacenamiento elevado'};
  if(percentUsed>='50') return {level:'info',message:'Almacenamiento moderado'};
  return {level:'ok',message:'Almacenamiento normal'};
}