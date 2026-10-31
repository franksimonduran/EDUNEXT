import { bootLearningPage } from './learning-page.js';
import { estimateStorage, listPackages } from '../offline/storage-manager.js';
import { bytesToMB } from '../utils/storage-format.js';

bootLearningPage(route=>({route,grade:route.grade}), async ({route},_route,shell)=>{
 document.title='Almacenamiento Local | EDUNEXT';
 const root=document.querySelector('#learning-content');
 const local=await listPackages().catch(()=>[]);
 const est=await estimateStorage().catch(()=>null);

 function render(){
  const used=est?.usage||0;
  const quota=est?.quota||0;
  root.innerHTML=`<header><h1>Almacenamiento local</h1><p>Consulta el espacio utilizado por tus contenidos educativos</p></header>
  <section class="downloads-grid">
   <article class="download-card"><h3>Espacio estimado utilizado</h3><strong>${bytesToMB(used)}</strong></article>
   <article class="download-card"><h3>Cuota estimada</h3><strong>${quota? bytesToMB(quota): 'No disponible'}</strong></article>
   <article class="download-card"><h3>Paquetes descargados</h3><strong>${local.length}</strong></article>
   <article class="download-card"><h3>Datos académicos locales</h3><strong>—</strong></article>
  </section>
  <section class="download-card">
   <h2>Paquetes instalados</h2>
   ${local.length? local.map(p=>`<div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--color-border)"><span>${p.course} - ${p.unit||''}</span><span>${p.verified?'Verificado':'Sin verificar'}</span></div>`).join(''): '<div class="empty">Sin paquetes</div>'}
   <div style="display:flex;gap:.5rem;margin-top:1rem"><a class="button-primary" href="descargas.html">Gestionar descargas</a><a class="button-secondary" href="mis-descargas.html">Mis Descargas</a></div>
  </section>`;
 }
 render();
 return ()=>{};
},{active:'courses'});
