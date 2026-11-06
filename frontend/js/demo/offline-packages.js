// EDUNEXT D4 — SOLO recursos públicos del recorrido guiado.
// No reutilizar para rutas académicas autenticadas, peticiones API o registros reales.
// Incrementar versión de caché si cambia el inventario o estructura de módulos.
export const DEMO_OFFLINE_CACHE='edunext-demo-offline-v2';
export const DEMO_OFFLINE_VERSION='D5.0';
export const DEMO_PACKAGES=Object.freeze([
 {id:'base',title:'Inicio y centro offline',description:'Portada, navegación, recursos gráficos y estado de paquetes.',required:[
  'index.html','demo.html','offline-demo.html','offline.html','demo.webmanifest',
  'css/pages/demo.css','css/pages/demo-offline.css','css/pages/demo-polish-d5.css','js/demo/landing.js',
  'js/demo/offline-entry.js','js/demo/offline-packages.js','js/demo/offline-status.js',
  'js/offline/pwa.js','js/demo/scenario.js',
  'assets/images/Icono.png','assets/images/Logo%20Horizontal.png',
  'assets/images/branding/mark.svg','assets/images/branding/edunext-192.png',
  'assets/images/branding/edunext-512.png']},
 {id:'lectura',title:'Comunicación · Comprensión lectora',description:'Lectura, cinco preguntas y corrección en JavaScript.',required:[
  'student/recorrido-demo.html','css/pages/demo-story.css','js/demo/activity.js','js/demo/scenario.js']},
 {id:'progreso',title:'Progreso, monitor y administrador',description:'Indicadores y reportes ficticios consultables en los tres perfiles.',required:[
  'student/progreso-demo.html','monitor/seguimiento-demo.html','admin/informe-demo.html',
  'css/pages/demo-journeys-d2.css','js/demo/role-pages.js',
  'js/demo/metrics.js','js/demo/scenario.js']},
 {id:'herramientas',title:'Tutor, Translate y Pronuncia',description:'Explicaciones preparadas, diccionario local y ejercicios escritos.',required:[
  'student/tutor-demo.html','student/traductor-demo.html','student/pronuncia-demo.html',
  'monitor/herramientas-ia-demo.html','admin/herramientas-ia-demo.html',
  'css/pages/demo-ai-d3.css','js/demo/ai-tools.js','js/demo/ai-guided.js','js/demo/metrics.js',
  'js/demo/scenario.js','js/demo/translation.js','js/services/translation.service.js',
  'js/data/dictionary-demo.data.js','js/data/languages.data.js',
  'js/demo/pronunciation.js','js/data/pronunciation-demo.data.js']},
 {id:'guia',title:'Guía educativa descargable',description:'Guía HTML independiente del Tutor guiado, sin datos personales.',required:[
  'js/services/offline-study.service.js','js/demo/ai-guided.js','js/demo/metrics.js','js/demo/scenario.js']}
]);
const PUBLIC_RESOURCE=/^(?:index\.html|demo\.html|offline-demo\.html|offline\.html|demo\.webmanifest|student\/(?:recorrido-demo|progreso-demo|tutor-demo|traductor-demo|pronuncia-demo)\.html|monitor\/(?:seguimiento-demo|herramientas-ia-demo)\.html|admin\/(?:informe-demo|herramientas-ia-demo)\.html|css\/pages\/demo(?:-story|-journeys-d2|-ai-d3|-offline|-polish-d5)?\.css|js\/demo\/[a-z0-9-]+\.js|js\/offline\/pwa\.js|js\/services\/(?:translation\.service|offline-study\.service)\.js|js\/data\/(?:dictionary-demo|languages|pronunciation-demo)\.data\.js|assets\/images\/(?:Icono\.png|Logo%20Horizontal\.png|branding\/(?:mark\.svg|edunext-(?:192|512)\.png)))$/i;
const APP_BASE=new URL('../../',import.meta.url);
let preparing=false;
export function getDemoBase(){return APP_BASE;}
export function getDemoPackage(id){return DEMO_PACKAGES.find(p=>p.id===id)||null;}
export function getDemoResourceUrl(relative){
 if(typeof relative!=='string'||!PUBLIC_RESOURCE.test(relative)||relative.includes('..'))throw new Error('Recurso fuera de la lista pública de demostración.');
 const url=new URL(relative,APP_BASE);
 if(url.origin!==APP_BASE.origin||!url.pathname.startsWith(APP_BASE.pathname)||url.search||url.hash)throw new Error('Origen, ruta o parámetros no permitidos.');
 return url.href;
}
export function getDemoRequired(id,{includeBase=true}={}){
 const p=getDemoPackage(id);if(!p)throw new Error('Paquete no definido.');
 const entries=(includeBase&&id!=='base'?[...DEMO_PACKAGES[0].required,...p.required]:p.required);
 return [...new Set(entries)].map(getDemoResourceUrl);
}
export function isValidDemoResponse(response,relative){
 if(!response||!response.ok||response.status!==200||response.redirected||response.type==='opaque')return false;
 const cacheControl=response.headers.get('Cache-Control')||'';
 const vary=response.headers.get('Vary')||'';
 if(/(?:private|no-store)/i.test(cacheControl)||/(?:\*|cookie|authorization)/i.test(vary))return false;
 if(response.headers.has('Set-Cookie')||response.headers.has('X-Aithron-Offline-Fallback')||response.headers.has('X-EDUNEXT-Offline-Fallback'))return false;
 const type=response.headers.get('Content-Type')||'';
 if(/\.html$/i.test(relative))return /text\/html/i.test(type);
 if(/\.css$/i.test(relative))return /text\/css/i.test(type);
 if(/\.js$/i.test(relative))return /javascript|ecmascript/i.test(type);
 if(/\.(?:json|webmanifest)$/i.test(relative))return /json|manifest/i.test(type);
 if(/\.svg$/i.test(relative))return /image\/svg\+xml/i.test(type);
 if(/\.png$/i.test(relative))return /image\/png/i.test(type);
 return false;
}
export async function getDemoPackageStatus(id){
 const resources=getDemoRequired(id);
 if(!('caches' in globalThis))return {id,status:'unsupported',total:resources.length,present:0,ready:false};
 try{
  const cache=await caches.open(DEMO_OFFLINE_CACHE);
  let present=0;
  for(const url of resources){
   const response=await cache.match(url);
   const relative=new URL(url).pathname.slice(APP_BASE.pathname.length);
   if(isValidDemoResponse(response,relative)&&Number((await response.clone().arrayBuffer()).byteLength)>0)present++;
  }
  return {id,status:present===resources.length?'prepared':present?'partial':'missing',total:resources.length,present,ready:present===resources.length};
 }catch{return {id,status:'unavailable',total:resources.length,present:0,ready:false};}
}
export async function prepareDemoPackages(ids,onProgress=()=>{}){
 if(!Array.isArray(ids)||!ids.length||!ids.every(id=>Boolean(getDemoPackage(id))))throw new Error('Selecciona paquetes válidos.');
 if(preparing)throw new Error('Hay una preparación en curso.');
 if(!('serviceWorker' in navigator)||!('caches' in globalThis))throw new Error('Necesitas HTTPS o localhost y un navegador compatible.');
 if(navigator.onLine===false)throw new Error('Conéctate a internet para preparar los recursos que faltan.');
 const resources=[...new Set(ids.flatMap(id=>getDemoRequired(id)))];
 preparing=true;
 try{
  const base=APP_BASE;
  const registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname});
  await navigator.serviceWorker.ready;
  if(registration.waiting)throw new Error('Hay una actualización pendiente. Cierra otras pestañas y recarga antes de preparar.');
  const cache=await caches.open(DEMO_OFFLINE_CACHE);
  let done=0;
  for(const url of resources){
   const relative=new URL(url).pathname.slice(base.pathname.length);
   // Download only public, same-origin resources. Never request cookies.
   const response=await fetch(url,{credentials:'omit',cache:'reload',redirect:'error'});
   if(!isValidDemoResponse(response,relative))throw new Error('Recurso no cacheable o no disponible: '+relative);
   const buffer=await response.clone().arrayBuffer();
   if(!buffer.byteLength)throw new Error('Archivo vacío: '+relative);
   // Quota errors abort; package is not marked complete unless ALL verify.
   await cache.put(url,response.clone());
   const checked=await cache.match(url);
   if(!isValidDemoResponse(checked,relative)||(await checked.arrayBuffer()).byteLength!==buffer.byteLength)throw new Error('No pudo verificarse el recurso: '+relative);
   done++;onProgress({done,total:resources.length,resource:relative});
  }
  const states=await Promise.all(ids.map(getDemoPackageStatus));
  if(states.some(item=>!item.ready))throw new Error('Uno o más paquetes no pasaron la verificación final.');
  return states;
 }finally{preparing=false;}
}
export async function prepareDemoPackage(id,onProgress=()=>{}){
 const [result]=await prepareDemoPackages([id],onProgress);
 return result;
}
