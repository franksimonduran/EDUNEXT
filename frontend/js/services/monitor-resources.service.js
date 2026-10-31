import {learningResources} from './monitor-learning-resources.service.js';
import {assignedCourses} from './monitor-courses.service.js';
import {MONITOR_CACHE} from '../offline/monitor-preparation.js';
import {safeResourceURL} from '../utils/content-safety.js';
export {safeResourceURL};
const base=new URL('../../',import.meta.url);
export async function contentResources(){
 const courses=await assignedCourses(),rows=[];
 // This image is an original application illustration, not a subject-specific diagram.
 rows.push({id:'image:open-book',type:'image',name:'Libro abierto — ilustración de lectura',description:'Ilustración original de la aplicación; recurso compartido de lectura.',courseId:'',grade:null,theme:'Lectura',version:1,url:new URL('assets/images/branding/open-book.svg',base).href,assets:[],alt:'Ilustración de un libro abierto',source:'Recurso original del repositorio',license:'Licencia no declarada; revisar antes de distribución institucional.'});
 for(const c of courses){
  for(const r of learningResources(c.grade).filter(r=>r.courseId===c.id&&['lesson','practice','vocabulary'].includes(r.type)))rows.push({...r,type:r.type==='lesson'?'text':r.type,source:'Catálogo educativo demostrativo existente',license:'Revisar licencia y aprobación pedagógica antes de distribuir.'});
  for(const u of c.units)for(const l of u.lessons)rows.push({id:'audio:'+l.id,type:'audio',name:'Narración: '+l.title,description:l.objective,courseId:c.id,grade:c.grade,theme:u.title,version:1,url:new URL(l.audio.src,new URL('student/',base)).href,assets:[],transcript:l.audio.transcript,language:l.audio.language,source:'Audio educativo local de demostración',license:'Procedencia: tools/generate-demo-audio.ps1; revisar condiciones de voz y distribución.'});
 }
 return rows;
}
export async function resourceState(r){
 const urls=[r.url,...r.assets||[]];if(urls.some(u=>!safeResourceURL(u)))return 'unavailable';
 if(typeof caches!=='undefined'){let complete=true;for(const url of urls)if(!(await caches.match(url))?.ok){complete=false;break;}if(complete)return 'downloaded';}
 return navigator.onLine?'local':'unavailable';
}
export async function verifiedResources(){return Promise.all((await contentResources()).map(async r=>({...r,availability:await resourceState(r)})));}
export async function checkResource(r){
 if(!safeResourceURL(r.url))return false;
 if(!navigator.onLine)return (await resourceState(r))==='downloaded';
 try{const response=await fetch(r.url,{method:'HEAD'});return response.ok&&!response.headers.get('X-Aithron-Offline-Fallback');}catch{return false;}
}
export {MONITOR_CACHE};
