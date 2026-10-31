import { bootLearningPage } from './learning-page.js';
import { listPackages, removePackage } from '../offline/package-manager.js';

bootLearningPage(route=>({route,grade:route.grade}), async ({route},_route,shell)=>{
 document.title='Mis Descargas | EDUNEXT';
 const root=document.querySelector('#learning-content');
 let local=await listPackages().catch(()=>[]);

 function render(){
  root.innerHTML=`<header><h1>Mis Descargas</h1><p>Consulta los contenidos que puedes utilizar sin conexión</p></header>
  <section class="downloads-grid">
   ${local.length? local.map(p=>`<article class="download-card">
    <h3>${p.course} - ${p.unit||''}</h3>
    <p>Grado ${p.grade} · Versión ${p.version||'1.0.0'} · ${p.verified?'Verificado':'Sin verificar'}</p>
    <p>Descargado: ${p.downloadedAt? new Date(p.downloadedAt).toLocaleString(): '-'}</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
     <a class="button-primary" href="aprende.html">Abrir</a>
     <button class="button-secondary" data-del="${p.id}">Eliminar</button>
    </div>
   </article>`).join(''): '<div class="empty">Sin contenidos descargados</div>'}
  </section>`;
  root.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',async ()=>{
   if(!confirm('Eliminar este paquete? Se quitarán sus recursos locales. Los datos académicos se conservarán.')) return;
   await removePackage(b.dataset.del).catch(()=>{});
   local=await listPackages().catch(()=>[]);
   render();
  }));
 }
 render();
 return ()=>{};
},{active:'courses'});
