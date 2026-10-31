export async function checkStorageAvailability(){
  const results={
    indexedDB:false,
    cacheStorage:false,
    localStorage:false,
    sessionStorage:false,
    storageManager:false,
    persistence:false,
  };
  
  try{
    results.indexedDB=typeof indexedDB!=='undefined';
    if(results.indexedDB){
      const {openAithronDb}=await import('../offline/database-schema.js');
      const db=await openAithronDb();
      results.indexedDB=true;
      db.close();
    }
  }catch{}
  
  results.cacheStorage='caches' in window;
  results.localStorage=typeof localStorage!=='undefined';
  results.sessionStorage=typeof sessionStorage!=='undefined';
  results.storageManager='storage' in navigator && 'estimate' in navigator.storage;
  
  if('storage' in navigator && 'persisted' in navigator.storage){
    results.persistence=await navigator.storage.persisted();
  }
  
  return results;
}

export async function getAvailableStorageAPIs(){
  const apis=[
    {name:'IndexedDB',available:typeof indexedDB!=='undefined'},
    {name:'Cache Storage',available:'caches' in window},
    {name:'LocalStorage',available:typeof localStorage!=='undefined'},
    {name:'SessionStorage',available:typeof sessionStorage!=='undefined'},
    {name:'StorageManager.estimate()',available:'storage' in navigator && 'estimate' in navigator.storage},
    {name:'StorageManager.persist()',available:'storage' in navigator && 'persist' in navigator.storage},
    {name:'StorageManager.persisted()',available:'storage' in navigator && 'persisted' in navigator.storage},
  ];
  return apis;
}

export function isStorageAPIAvailable(api){
  const apis={
    indexedDB:()=>typeof indexedDB!=='undefined',
    cacheStorage:()=>'caches' in window,
    localStorage:()=>typeof localStorage!=='undefined',
    sessionStorage:()=>typeof sessionStorage!=='undefined',
    storageEstimate:()=>'storage' in navigator && 'estimate' in navigator.storage,
    storagePersist:()=>'storage' in navigator && 'persist' in navigator.storage,
    storagePersisted:()=>'storage' in navigator && 'persisted' in navigator.storage,
  };
  return apis[api]?apis[api]():false;
}

export function getStorageQuotaInfo(estimate){
  if(!estimate||!estimate.quota) return {level:'unknown',message:'Cuota desconocida'};
  const pct=(estimate.usage/estimate.quota)*100;
  if(pct>=95) return {level:'critical',message:'Cuota casi agotada',percent:pct.toFixed(1)};
  if(pct>=80) return {level:'warning',message:'Cuota alta',percent:pct.toFixed(1)};
  if(pct>=50) return {level:'info',message:'Cuota moderada',percent:pct.toFixed(1)};
  return {level:'ok',message:'Cuota normal',percent:pct.toFixed(1)};
}