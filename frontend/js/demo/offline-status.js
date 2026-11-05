import {DEMO_PACKAGES,DEMO_OFFLINE_VERSION,getDemoBase,getDemoPackageStatus,prepareDemoPackage,prepareDemoPackages} from './offline-packages.js';
import {initServiceWorker} from '../offline/pwa.js';

const root=document.querySelector('#offline-packages');
const feedback=document.querySelector('#offline-action-status');
const bar=document.querySelector('#offline-progress');
const progress=document.querySelector('#offline-progress-wrap');
const progressText=document.querySelector('#offline-progress-text');
const progressNumber=document.querySelector('#offline-progress-number');
const all=document.querySelector('#offline-prepare-all');
const verify=document.querySelector('#offline-verify');
const download=document.querySelector('#offline-download-guide');
const guideStatus=document.querySelector('#offline-guide-status');
const persist=document.querySelector('#offline-persist');
const storageNote=document.querySelector('#offline-storage-note');
let busy=false;
let revision=0;
const links={
 base:[['Abrir portada','demo.html'],['Centro offline','offline-demo.html']],
 lectura:[['Abrir lectura','student/recorrido-demo.html?modo=demo']],
 progreso:[['Estudiante','student/progreso-demo.html?modo=demo'],['Monitor','monitor/seguimiento-demo.html?modo=demo'],['Administrador','admin/informe-demo.html?modo=demo']],
 herramientas:[['Tutor','student/tutor-demo.html?modo=demo'],['Traductor','student/traductor-demo.html?modo=demo'],['Pronuncia','student/pronuncia-demo.html?modo=demo']],
 guia:[]
};
const stateLabels={prepared:'Preparado',partial:'Incompleto',missing:'No preparado',unavailable:'Almacenamiento no disponible',unsupported:'No compatible'};
function message(value,type='info'){
 feedback.textContent=value;feedback.dataset.kind=type;
}
function progressUpdate(p){
 progress.hidden=false;
 bar.max=p.total;bar.value=p.done;
 progressText.textContent=p.done===p.total?'Verificando el paquete…':'Descargando recursos educativos públicos…';
 progressNumber.textContent=p.done+' / '+p.total+' archivos';
}
async function updateEnvironment(){
 const online=document.querySelector('#offline-connectivity');
 online.textContent=navigator.onLine?'Navegador conectado':'Sin conexión (según navegador)';
 const sw=document.querySelector('#offline-sw');
 if(!('serviceWorker' in navigator)){sw.textContent='No compatible';}
 else{
  try{
   const registration=await navigator.serviceWorker.getRegistration(getDemoBase().href);
   sw.textContent=registration?.waiting?'Actualización pendiente':navigator.serviceWorker.controller?'Controlando esta página':registration?.active?'Activo; recarga para control':'No activado';
  }catch{sw.textContent='No disponible';}
 }
 const space=document.querySelector('#offline-space');
 try{
  const estimate=await navigator.storage?.estimate?.();
  const used=Number(estimate?.usage);
  if(Number.isFinite(used))space.textContent=(used/1024/1024).toFixed(1)+' MB estimados';
  else space.textContent='No disponible';
 }catch{space.textContent='No disponible';}
}
async function refresh(){
 const current=++revision;
 const states=await Promise.all(DEMO_PACKAGES.map(async p=>getDemoPackageStatus(p.id)));
 if(current!==revision||!root)return;
 root.replaceChildren();
 const grid=document.createElement('div');grid.className='package-grid';
 for(let i=0;i<DEMO_PACKAGES.length;i++){
  const pkg=DEMO_PACKAGES[i],s=states[i];
  const card=document.createElement('article');card.className='package-card';
  const copy=document.createElement('div');
  const title=document.createElement('h3');title.textContent=pkg.title;
  const desc=document.createElement('p');desc.textContent=pkg.description;
  const details=document.createElement('div');details.className='package-details';
  const tag=document.createElement('span');tag.className='package-state';tag.dataset.status=s.status;tag.textContent=stateLabels[s.status]||s.status;
  const count=document.createElement('span');count.textContent=s.present+' / '+s.total+' recursos verificados';
  details.append(tag,count);copy.append(title,desc,details);
  const actions=document.createElement('div');actions.className='package-card-actions';
  const action=document.createElement('button');action.type='button';action.className='package-action';action.dataset.prepare=pkg.id;
  action.textContent=s.ready?'Verificar / actualizar':'Preparar';
  action.disabled=busy||!navigator.onLine||!('caches' in globalThis);
  actions.append(action);
  if(s.ready){for(const [label,href] of links[pkg.id]||[]){
   const link=document.createElement('a');link.className='package-link';link.href=new URL(href,getDemoBase()).href;link.textContent=label;actions.append(link);
  }}
  card.append(copy,actions);grid.append(card);
 }
 root.append(grid);
 const ready=states.filter(s=>s.ready).length;
 document.querySelector('#offline-summary').textContent=ready+' / '+states.length+' paquetes';
 all.disabled=busy||!navigator.onLine||!('serviceWorker' in navigator)||!('caches' in globalThis);
 verify.disabled=busy;
 download.disabled=busy||!states.some(s=>s.id==='guia'&&s.ready);
 await updateEnvironment();
}
async function run(ids){
 if(busy)return;
 busy=true;
 message('Preparando archivos públicos. No se guardan datos de estudiantes ni cuentas.');
 progress.hidden=false;bar.value=0;bar.max=100;
 all.disabled=true;
 try{
  const list=ids.length===1?await prepareDemoPackage(ids[0],progressUpdate):await prepareDemoPackages(ids,progressUpdate);
  const count=Array.isArray(list)?list.length:1;
  message('Preparación completa: '+count+' paquete(s) verificados. Puedes probar la demo con el navegador sin conexión.','success');
 }catch(error){
  message('No se confirmó la preparación completa: '+(error?.message||'error de almacenamiento')+'. Reintenta con conexión y espacio disponible.','error');
 }finally{
  busy=false;progress.hidden=true;await refresh();
 }
}
root?.addEventListener('click',event=>{
 const button=event.target.closest('button[data-prepare]');
 if(button)run([button.dataset.prepare]);
});
all?.addEventListener('click',()=>run(DEMO_PACKAGES.map(p=>p.id)));
verify?.addEventListener('click',async()=>{message('Verificando archivos almacenados…');await refresh();message('Verificación terminada. Los estados muestran recursos presentes en la caché.','success');});
download?.addEventListener('click',async()=>{
 if(download.disabled)return;
 guideStatus.textContent='Preparando la guía pública…';
 try{
  // Dynamic imports keep this optional resource outside mandatory loading.
  const [{GUIDED_TOPICS},{downloadOfflineStudyGuide}]=await Promise.all([
   import('./ai-guided.js'),import('../services/offline-study.service.js')
  ]);
  const examples=GUIDED_TOPICS.flatMap(topic=>topic.prompts.slice(0,2).map(item=>({
   grade:5,subject:topic.title,title:item.question,explanation:item.answer,
   easy:item.answer,hint:'Lee y explica con tus propias palabras.',guide:item.activity
  })));
  downloadOfflineStudyGuide(5,examples);
  guideStatus.textContent='Guía HTML generada para descargar. La apertura posterior depende de tu dispositivo.';
 }catch{guideStatus.textContent='No se pudo crear la guía; verifica que su paquete esté preparado.';}
});
persist?.addEventListener('click',async()=>{
 try{
  if(!navigator.storage?.persist){storageNote.textContent='El navegador no admite solicitar almacenamiento persistente.';return;}
  const granted=await navigator.storage.persist();
  storageNote.textContent=granted?'El navegador concedió almacenamiento persistente (sin garantía absoluta).':'El navegador no concedió persistencia. Los paquetes pueden eliminarse por políticas de espacio.';
 }catch{storageNote.textContent='No se pudo completar la solicitud de persistencia.';}
});
window.addEventListener('online',refresh);
window.addEventListener('offline',refresh);
navigator.serviceWorker?.addEventListener('controllerchange',refresh);
updateEnvironment();
initServiceWorker().finally(refresh);
