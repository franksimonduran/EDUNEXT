import { bootLearningPage } from './learning-page.js';
import { listPending } from '../offline/sync-queue.js';
import { formatDate } from '../utils/storage-format.js';

bootLearningPage(route=>({route,grade:route.grade}), async ({route},_route,shell)=>{
 document.title='Cola de Sincronización | EDUNEXT';
 const root=document.querySelector('#learning-content');
 const pending=await listPending().catch(()=>[]);

 function render(){
  root.innerHTML=`<header><h1>Cola de Sincronización</h1><p>Cambios pendientes almacenados en este dispositivo</p></header>
  <section>
   ${pending.length? pending.map(o=>`<article class="download-card">
    <h3>${o.type}</h3>
    <p>Creado: ${formatDate(o.createdAt)} · Estado: ${o.status} · Intentos: ${o.attempts||0}</p>
   </article>`).join(''): '<div class="empty">No hay operaciones pendientes</div>'}
  </section>
  <p><a class="button-secondary" href="sincronizacion.html">Volver a EDUNEXT Sync</a></p>`;
 }
 render();
 return ()=>{};
},{active:'courses'});
