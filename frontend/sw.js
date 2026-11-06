// EDUNEXT identity update; retain installed-worker scope and every cache namespace.
// Fresh public-only namespaces. Legacy caches are retained but never consulted here.
// Do not delete pending work or assume older entries were safe for shared devices.
const STATIC_CACHE='aithron-static-v2';
const CONTENT_CACHE='aithron-public-v2';
const PREPARED_CACHE='aithron-monitor-shell-v1';
// Espacio público aislado D4: nunca usarlo para APIs, cuentas ni documentos privados.
const DEMO_CACHE='edunext-demo-offline-v2';
const DEMO_PAGES=new Set([
 'index.html','demo.html','offline-demo.html',
 'student/recorrido-demo.html','student/progreso-demo.html',
 'student/tutor-demo.html','student/traductor-demo.html','student/pronuncia-demo.html',
 'monitor/seguimiento-demo.html','monitor/herramientas-ia-demo.html',
 'admin/informe-demo.html','admin/herramientas-ia-demo.html'
]);
function demoResponseHeaders(response){
 const headers=headersOf(response);
 headers['X-EDUNEXT-Demo-Offline']='prepared-public-only';
 return headers;
}

const STATIC_ASSETS=[
 'offline.html','css/variables.css','css/base.css','css/experience.css','css/monitor/account-shared.css'
];

// Explicit opt-in shells only. Never serve arbitrary cached HTML or private paths.
const PREPARED_PAGE=/^(?:monitor|admin)\/[^/]+\.html$|^student\/(?:leccion|tutor|palabra|juego|ejercicio)\.html$/;

function relativePath(url){
 const scope=new URL('.',self.location.href).pathname;
 return url.pathname.startsWith(scope)?url.pathname.slice(scope.length):'';
}

function headersOf(response){
 const headers={};
 response.headers.forEach((value,key)=>{headers[key]=value;});
 return headers;
}

async function preparedResponse(req,{ignoreSearch=false}={}){
 const cache=await caches.open(PREPARED_CACHE);
 const hit=await cache.match(req,ignoreSearch?{ignoreSearch:true}:{});
 if(!hit?.ok)return null;
 const headers=headersOf(hit);
 headers['X-EDUNEXT-Offline']='prepared';
 return new Response(hit.body,{status:hit.status,statusText:hit.statusText,headers});
}

async function offlineFallback(){
 try{
  const shell=await caches.open(STATIC_CACHE);
  const fallback=await shell.match(new URL('offline.html',self.location.href).href);
  if(fallback){
   const headers=headersOf(fallback);
   headers['X-Aithron-Offline-Fallback']='1';
   headers['X-EDUNEXT-Offline-Fallback']='static';
   return new Response(fallback.body,{status:503,headers});
  }
 }catch{}
 return new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
}

self.addEventListener('install', e=>{
 e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(STATIC_ASSETS.map(path=>new URL(path,self.location.href).href))));
});

self.addEventListener('activate', e=>{
 e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e=>{
 const req=e.request;
 if(req.method!=='GET') return;
 const url=new URL(req.url);
 if(url.origin!==location.origin) return;
 const relative=relativePath(url);
 if(relative.startsWith('api/') || req.headers.has('authorization')) return;
 if(req.headers.get('accept')?.includes('text/html')){
  e.respondWith((async()=>{
   try{
    return await fetch(req);
   }catch{
    // Solo navegación pública D4 preparada explícitamente (sin consultas privadas).
    if(DEMO_PAGES.has(relative)){
     try{
      const demoCache=await caches.open(DEMO_CACHE);
      const cached=await demoCache.match(req,{ignoreSearch:true});
      if(cached?.ok)return new Response(cached.body,{status:200,headers:demoResponseHeaders(cached)});
     }catch{}
    }
    if(PREPARED_PAGE.test(relative)){
     try{
      const prepared=await preparedResponse(req,{ignoreSearch:true});
      if(prepared)return prepared;
     }catch{}
    }
    return offlineFallback();
   }
  })());
  return;
 }
 // Only repository-owned public directories. Never use extension alone as authorization.
 const publicAsset=/^(?:js\/.*\.js|css\/.*\.css|assets\/.*\.(?:png|jpg|jpeg|svg|webp|woff2|wav|mp3))$/.test(relative);
 if((!publicAsset && relative!=='demo.webmanifest') || url.search) return;
 const cacheable=response=>response.ok && !response.redirected && response.type!=='opaque'
   && !/(?:private|no-store|no-cache)/i.test(response.headers.get('Cache-Control')||'')
   && !/(?:\*|cookie|authorization)/i.test(response.headers.get('Vary')||'');
 e.respondWith((async()=>{
  try{
   const response=await fetch(req);
   if(cacheable(response)){
    // Cache quota failure must not discard a successful network response.
    try{const cache=await caches.open(CONTENT_CACHE);await cache.put(req,response.clone());}catch{}
   }
   return response;
  }
  catch{
   try{
    // Primero archivos públicos descargados y verificados para esta demo.
    // La caché D4 puede no existir en instalaciones antiguas.
    try{
     const demoCache=await caches.open(DEMO_CACHE);
     const demoAsset=await demoCache.match(req);
     if(demoAsset?.ok)return demoAsset;
    }catch{}
    const cache=await caches.open(CONTENT_CACHE);
    const cached=await cache.match(req);
    if(cached?.ok)return cached;
    const prepared=await preparedResponse(req);
    if(prepared)return prepared;
   }catch{}
   return new Response('Recurso no preparado para uso offline',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }
 })());
});
