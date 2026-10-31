import { openAithronDb } from '../offline/database-schema.js';
import { listPackages } from '../offline/package-manager.js';
import { listPending } from '../offline/sync-queue.js';

const SERVICE_DEFINITIONS=[
  {id:'frontend',name:'Frontend EDUNEXT',type:'core',category:'frontend',check:checkFrontend},
  {id:'serviceWorker',name:'Service Worker',type:'pwa',category:'pwa',check:checkServiceWorker},
  {id:'indexedDB',name:'IndexedDB',type:'storage',category:'storage',check:checkIndexedDB},
  {id:'cacheStorage',name:'Cache Storage',type:'storage',category:'storage',check:checkCacheStorage},
  {id:'syncLocal',name:'EDUNEXT Sync (Local)',type:'sync',category:'sync',check:checkSyncLocal},
  {id:'syncRemote',name:'EDUNEXT Sync (Remoto)',type:'sync',category:'sync',check:checkSyncRemote,integrated:false},
  {id:'fastapi',name:'FastAPI Backend',type:'backend',category:'backend',check:checkFastAPI,integrated:false},
  {id:'postgresql',name:'PostgreSQL',type:'backend',category:'backend',check:checkPostgreSQL,integrated:false},
  {id:'aithronAI',name:'EDUNEXT AI',type:'ai',category:'ai',check:checkAithronAI,integrated:false},
  {id:'contentPackages',name:'Paquetes Educativos Offline',type:'content',category:'content',check:checkContentPackages},
  {id:'manifest',name:'Manifiesto PWA',type:'pwa',category:'pwa',check:checkManifest},
  {id:'storageEstimate',name:'Estimación de Almacenamiento',type:'storage',category:'storage',check:checkStorageEstimate},
];

export async function checkAllServices(){
  const results=[];
  for(const svc of SERVICE_DEFINITIONS){
    const start=performance.now();
    let state,evidence,message,method;
    try{
      const checkResult=await svc.check();
      state=svc.integrated===false?'not-integrated':checkResult.ok?'available':(checkResult.ok===false?'unavailable':'unknown');
      evidence=checkResult.evidence||'';
      message=checkResult.message||'';
      method=checkResult.method||'check';
    }catch(e){
      state='error';
      evidence='error';
      message=e.message;
      method='exception';
    }
    const duration=Math.round(performance.now()-start);
    results.push({
      id:svc.id,
      name:svc.name,
      description:svc.description||'Comprobación local de '+svc.name,
      type:svc.type,
      category:svc.category,
      state,
      evidence,
      message,
      method,
      duration,
      integrated:svc.integrated!==false,
      checkedAt:Date.now(),
    });
  }
  return results;
}

export async function getServiceDetail(id){
  const svc=SERVICE_DEFINITIONS.find(s=>s.id===id);
  if(!svc) return null;
  const result=await svc.check();
  return {id:svc.id,name:svc.name,type:svc.type,category:svc.category,...result,integrated:svc.integrated!==false};
}

async function checkFrontend(){
  return {ok:true,evidence:'Aplicación cargada',method:'document.readyState'};
}

async function checkServiceWorker(){
  if(!('serviceWorker' in navigator)) return {ok:false,evidence:'SW no soportado',method:'navigator.serviceWorker'};
  const reg=await navigator.serviceWorker.getRegistration();
  if(!reg) return {ok:false,evidence:'No registrado',method:'getRegistration'};
  const controlling=!!navigator.serviceWorker.controller;
  return {ok:true,evidence:`Registrado (scope: ${reg.scope})${controlling?', controlando página':''}`,method:'getRegistration'};
}

async function checkIndexedDB(){
  if(typeof indexedDB==='undefined') return {ok:false,evidence:'IndexedDB no soportado',method:'indexedDB'};
  try{
    const {openAithronDb}=await import('../offline/database-schema.js');
    const db=await openAithronDb();
    const version=db.version;
    db.close();
    return {ok:true,evidence:`DB v${version} accesible`,method:'openAithronDb'};
  }catch(e){
    return {ok:false,evidence:e.message,method:'openAithronDb'};
  }
}

async function checkCacheStorage(){
  if(!('caches' in window)) return {ok:false,evidence:'Cache Storage no soportado',method:'caches'};
  const keys=await caches.keys();
  const appCaches=keys.filter(k=>k.startsWith('aithron'));
  return {ok:true,evidence:`${appCaches.length} cachés de app (${keys.length} total)`,method:'caches.keys()'};
}

async function checkSyncLocal(){
  const {listPending}=await import('../offline/sync-queue.js');
  const pending=await listPending();
  return {ok:true,evidence:`${pending.length} operaciones pendientes`,method:'syncQueue'};
}

async function checkSyncRemote(){
  return {ok:false,evidence:'Sin integración FastAPI',method:'config',integrated:false};
}

async function checkFastAPI(){
  return {ok:false,evidence:'Sin configuración de endpoint',method:'config',integrated:false};
}

async function checkPostgreSQL(){
  return {ok:false,evidence:'Sin acceso directo desde navegador',method:'n/a',integrated:false};
}

async function checkAithronAI(){
  return {ok:false,evidence:'Servicios IA sin integrar',method:'config',integrated:false};
}

async function checkContentPackages(){
  const pkgs=await listPackages();
  return {ok:true,evidence:`${pkgs.length} paquetes`,method:'package-manager'};
}

async function checkManifest(){
  const link=document.querySelector('link[rel="manifest"]');
  if(!link) return {ok:false,evidence:'No hay link rel=manifest',method:'DOM'};
  try{
    const res=await fetch(link.href);
    if(res.ok){const manifest=await res.json();return {ok:true,evidence:`${manifest.name||'manifest'} v${manifest.version||'?'}`,method:'fetch manifest'};}
    return {ok:false,evidence:'Manifiesto no accesible',method:'fetch'};
  }catch{return {ok:false,evidence:'Error al leer manifiesto',method:'fetch'};}
}

async function checkStorageEstimate(){
  if(!('storage' in navigator && 'estimate' in navigator.storage)) return {ok:false,evidence:'StorageManager.estimate no disponible',method:'storage.estimate'};
  const est=await navigator.storage.estimate();
  const usedMB=(est.usage/1024/1024).toFixed(2);
  const quotaMB=(est.quota/1024/1024).toFixed(2);
  const pct=est.quota?((est.usage/est.quota)*100).toFixed(1):'?';
  return {ok:true,evidence:`${usedMB}MB / ${quotaMB}MB (${pct}%)`,method:'storage.estimate()'};
}

export function getServiceDefinitions(){
  return SERVICE_DEFINITIONS.map(s=>({id:s.id,name:s.name,type:s.type,category:s.category,integrated:s.integrated!==false}));
}

export function getServiceCategories(){
  const cats={};
  for(const s of SERVICE_DEFINITIONS){
    if(!cats[s.category]) cats[s.category]=[];
    cats[s.category].push({id:s.id,name:s.name,type:s.type,integrated:s.integrated!==false});
  }
  return cats;
}
