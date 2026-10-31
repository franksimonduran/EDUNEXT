import { bootLearningPage } from './learning-page.js';
import { isOnline, onConnectivityChange } from '../offline/connectivity.js';
import { listPackages } from '../offline/package-manager.js';
import { listPending } from '../offline/sync-queue.js';

bootLearningPage(route=>({route,grade:route.grade}), async ({route},_route,shell)=>{
 document.title='Modo Sin Conexión | EDUNEXT';
 const root=document.querySelector('#learning-content');
 const local=await listPackages().catch(()=>[]);
 const pending=await listPending().catch(()=>[]);
 let online=isOnline();

 function render(){
  root.innerHTML=`<header><h1>Modo Sin Conexión</h1><p>Continúa con los recursos estáticos que hayas preparado</p></header>
  <section class="downloads-grid">
   <article class="download-card"><h3>Estado de conexión</h3><p class="${online?'status-descargado':'status-pending'}">${online?'Con conexión':'Sin conexión'}</p></article>
   <article class="download-card"><h3>Contenidos disponibles</h3><strong>${local.length}</strong></article>
   <article class="download-card"><h3>Actividades locales</h3><strong>—</strong></article>
   <article class="download-card"><h3>Cambios pendientes</h3><strong>${pending.length}</strong></article>
  </section>
  <section class="download-card">
   <h2>${online?'Tienes conexión de red':'Estás sin conexión'}</h2>
   <p>${online?'Comprueba que tus contenidos estén actualizados antes de desconectarte.':'Puedes abrir las lecciones y recursos estáticos que preparaste; las descargas de paquetes siguen siendo una limitación.'}</p>
   <div style="display:flex;gap:.5rem;flex-wrap:wrap">
    <a class="button-primary" href="mis-descargas.html">Mis Descargas</a>
    <a class="button-secondary" href="sincronizacion.html">EDUNEXT Sync</a>
   </div>
  </section>`;
 }
 render();
 const unsub=onConnectivityChange(s=>{ online=s.online; render(); });
 return ()=>unsub&&unsub();
},{active:'courses'});
