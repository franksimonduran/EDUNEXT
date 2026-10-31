// Explicit opt-in: cache only prepared static shells, never records or API responses.
export const MONITOR_CACHE='aithron-monitor-shell-v1';
const allowedHtml=/^(?:monitor|admin)\/[^/]+\.html$|^student\/(?:leccion|tutor|palabra|juego|ejercicio)\.html$/i;
const allowedAsset=/^(?:(?:js|css|assets)\/[^?#]+\.(?:js|css|svg|wav|mp3|png|jpg|jpeg|webp)|(?:monitor|admin)\/[^/]+\.html|student\/(?:leccion|tutor|palabra|juego|ejercicio)\.html|offline\.html)$/i;
const cacheable=response=>response.ok && !response.redirected && response.type!=='opaque'
 && !/(?:private|no-store)/i.test(response.headers.get('Cache-Control')||'')
 && !/(?:\*|cookie|authorization)/i.test(response.headers.get('Vary')||'');
const views=['evaluaciones','editar-evaluacion','preguntas-evaluacion','vista-previa-evaluacion','asignar-evaluacion','entregas-evaluacion','corregir-evaluacion','resultados-evaluacion'];
views.push('notas','registro-notas','detalle-calificacion','historial-academico','analisis-resultados','reportes','reporte-aula','reporte-estudiante');
views.push('tareas','editar-tarea','refuerzos','crear-refuerzo','asignar-actividad','detalle-actividad','seguimiento-actividades','seguimiento-refuerzo');
views.push('perfil','editar-perfil','configuracion','preferencias','accesibilidad','privacidad','seguridad','ayuda','calendario','agenda','planificacion-semanal','recordatorios','editar-recordatorio','notificaciones','preferencias-notificaciones');
export async function prepareStaticResources(startUrls,onProgress=()=>{}){
 if(!('serviceWorker' in navigator)||!('caches' in window))throw new Error('Este navegador no ofrece preparación offline. Usa HTTPS o localhost.');
 const base=new URL('../../',import.meta.url),reg=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname});
 await navigator.serviceWorker.ready;
 if(reg.waiting)throw new Error('Hay una actualización de aplicación pendiente. Guarda tu trabajo y cierra las otras pestañas antes de preparar el modo offline.');
 const pending=[...startUrls],seen=new Set(),cache=await caches.open(MONITOR_CACHE);
 pending.push(new URL('offline.html',base).href);
 while(pending.length){
  const url=pending.shift();if(seen.has(url))continue;
  const u=new URL(url);if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))throw new Error('No se puede preparar esta referencia estática: '+u.pathname);
  const relative=u.pathname.slice(base.pathname.length);
  if(!allowedAsset.test(relative)||(u.search&&! /\.html$/i.test(relative)))throw new Error('No se puede preparar esta referencia estática: '+u.pathname);
  if(/\.html$/i.test(relative)&&relative!=='offline.html'&&!allowedHtml.test(relative))throw new Error('Solo se pueden preparar shells docentes o lecciones student: '+relative);
  const response=await fetch(url,{cache:'reload'});
  if(!cacheable(response)||response.headers.get('X-Aithron-Offline-Fallback'))throw new Error('No se pudo preparar un recurso cacheable: '+u.pathname);
  if(/\.html$/i.test(u.pathname)&&!/text\/html/i.test(response.headers.get('Content-Type')||''))throw new Error('Tipo de contenido no válido: '+relative);
  await cache.put(url,response.clone());
  seen.add(url);
  let refs=[];
  if(/\.html$/i.test(u.pathname)){const doc=new DOMParser().parseFromString(await response.text(),'text/html');refs=[...doc.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(n=>n.getAttribute('src')||n.getAttribute('href'));}
  if(/\.js$/i.test(u.pathname)){const text=await response.text();refs=[...text.matchAll(/(?:^|;)\s*(?:import|export)\s+(?:[^;'";]*?\bfrom\s*)?['"](\.[^'"]+)['"]/gm)].map(m=>m[1]);}
  if(/\.css$/i.test(u.pathname)){const text=await response.text();refs=[...text.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map(m=>m[1]).filter(s=>!s.startsWith('data:'));}
  for(const ref of refs){const next=new URL(ref,url).href;if(!seen.has(next))pending.push(next);}
  onProgress(seen.size);
 }
 for(const name of ['mark','open-book']){const url=new URL(`assets/images/branding/${name}.svg`,base).href;const image=await fetch(url);if(!cacheable(image)||image.headers.get('X-Aithron-Offline-Fallback'))throw new Error('Imagen local no disponible');await cache.put(url,image);seen.add(url);}
 for(const url of seen)if(!(await cache.match(url))?.ok)throw new Error('No se completó la verificación de los recursos.');
 return [...seen];
}
export async function prepareMonitorOffline(onProgress=()=>{}){
 const base=new URL('../../',import.meta.url);return (await prepareStaticResources(views.map(v=>new URL('monitor/'+v+'.html',base).href),onProgress)).length;
}
