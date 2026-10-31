import { bootLearningPage } from './learning-page.js';
import { listPending, syncNow } from '../offline/sync-queue.js';
import { isOnline } from '../utils/storage-format.js';
import {syncStatus,syncBootstrap} from '../services/sync-api.service.js';
import {syncAuthenticatedProgress} from '../offline/confirmed-sync.js';
import {getAll} from '../offline/database.js';
import {ownedOperations,requireContext} from '../sync/protocol.js';
import {onAuthenticationCleared} from '../services/auth.service.js';

function renderAuthenticatedSync(root){
 let disposed=false,busy=false;
 root.innerHTML='<header><h1>EDUNEXT Sync</h1><p>Modo API · Consulta autenticada, sin datos demo.</p></header><section class="download-card"><h2>Progreso de lecciones</h2><p role="status" aria-live="polite" data-sync-status>Consultando disponibilidad del servidor…</p><p data-sync-pending></p><p data-sync-confirmed></p><button type="button" class="button-primary" data-sync-send disabled>Sincronizar progreso pendiente</button><p>Paquetes, prácticas, tareas y descarga de cambios todavía no disponibles. No se sincronizan calificaciones.</p></section>';
 const message=root.querySelector('[data-sync-status]'),button=root.querySelector('[data-sync-send]');
 async function refresh(){
  button.disabled=true;
  root.querySelector('[data-sync-pending]').textContent='';root.querySelector('[data-sync-confirmed]').textContent='';
  try{
   const status=await syncStatus();if(disposed)return;
   if(!status.available){message.textContent='Servidor accesible; sincronización deshabilitada hasta completar validación y autorización.';return;}
   const context=await syncBootstrap(),scope=requireContext(context);
   const queue=ownedOperations(await getAll('syncQueue'),context);
   const receipts=(await getAll('syncReceipts')).filter(r=>r.accountScope===scope&&Number.isFinite(Date.parse(r.confirmed_at)));
   if(disposed)return;
   root.querySelector('[data-sync-pending]').textContent=`Operaciones no confirmadas de esta cuenta: ${queue.filter(o=>o.status!=='confirmed').length}.`;
   const latest=receipts.map(r=>r.confirmed_at).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
   root.querySelector('[data-sync-confirmed]').textContent=latest?`Última confirmación guardada: ${new Date(latest).toLocaleString('es-PE')}`:'Todavía no hay recibos confirmados guardados para esta cuenta.';
   message.textContent='Servidor y contexto autenticado disponibles. Los datos locales siguen siendo provisionales hasta recibir confirmación.';
   button.disabled=!navigator.locks?.request||busy;
  }catch(error){if(!disposed)message.textContent=error.status===401?'Autenticación requerida; se conservan las operaciones.':error.status===403?'Acceso denegado; no se enviaron operaciones.':'Servicio no disponible o error de red; no se confirma ni sustituye trabajo con datos demo.';}
 }
 button.addEventListener('click',async()=>{
  if(busy||disposed)return;busy=true;button.disabled=true;message.textContent='Enviando operaciones autorizadas…';
  try{const result=await syncAuthenticatedProgress();if(!disposed){await refresh();message.textContent=`Operaciones confirmadas por servidor y guardadas localmente: ${result.confirmed}. Las demás conservan su estado pendiente, bloqueado o en conflicto.`;}}
  catch{if(!disposed)message.textContent='No se confirmó la sincronización. Se conservan los datos locales.';}
  finally{busy=false;/* Refresh explicitly before permitting another run. */if(!disposed)button.disabled=true;}
 });
 const hide=()=>{disposed=true;root.replaceChildren();};
 const unsubscribe=onAuthenticationCleared(hide);
 window.addEventListener('pagehide',hide,{once:true});
 refresh();
 return ()=>{unsubscribe();disposed=true;window.removeEventListener('pagehide',hide);root.replaceChildren();};
}

bootLearningPage(route=>({route,grade:route.grade}), async ({route},_route,shell)=>{
 document.title='EDUNEXT Sync | EDUNEXT';
 const root=document.querySelector('#learning-content');
 if(new URLSearchParams(location.search).get('modo')==='api')return renderAuthenticatedSync(root);
 const pending=await listPending().catch(()=>[]);
 const online=isOnline();

 function render(){
  root.innerHTML=`<header><h1>EDUNEXT Sync</h1><p>Conserva tus avances y prepáralos para sincronizarlos</p></header>
  <section class="downloads-grid">
   <article class="download-card"><h3>Cambios locales</h3><strong>${pending.length}</strong></article>
   <article class="download-card"><h3>Operaciones pendientes</h3><strong>${pending.length}</strong></article>
   <article class="download-card"><h3>Operaciones con error</h3><strong>0</strong></article>
   <article class="download-card"><h3>Última sincronización</h3><p>Sincronización con servidor pendiente de integración</p></article>
  </section>
  <section class="download-card">
   <h2>Avances guardados en este dispositivo</h2>
   <p>Tu trabajo local permanece disponible en este navegador mientras el almacenamiento se conserve.</p>
   <button class="button-primary" id="sync" ${(!online||true)?'disabled':''}>Sincronizar ahora</button>
   <p><small>Requiere conexión a API (pendiente de integración). No se envían datos automáticamente.</small></p>
   <a class="button-secondary" href="cola-sincronizacion.html">Ver cola</a>
  </section>`;
  root.querySelector('#sync').addEventListener('click',async ()=>{
   try { const r=await syncNow(); shell.openDialog('Sincronización', `<p>${r.reason||'Preparado'}</p>`); } catch(e){ shell.openDialog('Sincronización', `<p>${e.message}</p>`); }
  });
 }
 render();
 return ()=>{};
},{active:'courses'});
