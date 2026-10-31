import { bootLearningPage } from './learning-page.js';
import { getPackages } from '../data/offline-packages.data.js';
import { startDownload, getActive } from '../offline/download-manager.js';
import { listPackages, estimateStorage } from '../offline/storage-manager.js';
import { icon } from '../components/icons.js';
import { learningURL } from './learning-routes.js';
import { escapeHTML as esc } from '../components/student-ui.js';

bootLearningPage(route=>({route,grade:route.grade}), async ({route},_route,shell)=>{
 document.title='Centro de Descargas | EDUNEXT';
 const root=document.querySelector('#learning-content');
 const pkgs=getPackages();
  let local=await listPackages().catch(()=>[]);
 const est=await estimateStorage().catch(()=>null);
  let active=getActive();
  let filter='all';

 function render(){
  root.innerHTML=`<header class="downloads-hero">
   <h1>Centro de Descargas</h1>
   <p>Prepara recursos de aprendizaje para este dispositivo.</p>
   <p>Un registro de descarga no garantiza que todos los archivos sigan disponibles. Comprueba los recursos antes de trabajar sin conexión.</p>
  </header>
  <section class="downloads-grid">
   <article class="download-card"><h3>Cursos disponibles</h3><strong>${pkgs.length}</strong></article>
   <article class="download-card"><h3>Paquetes descargados</h3><strong>${local.length}</strong></article>
    <article class="download-card"><h3>Descargas en curso</h3><strong>${active.filter(job=>['preparing','downloading','verifying'].includes(job.status)).length}</strong></article>
   <article class="download-card"><h3>Espacio utilizado</h3><strong>${est?.usage? (est.usage/1048576).toFixed(1)+' MB':'No disponible'}</strong></article>
  </section>
  <h2>Catálogo de descargas</h2>
  <div class="toolbar">
    <button class="button-secondary" data-f="all" aria-pressed="${filter==='all'}">Todos</button>
    <button class="button-secondary" data-f="disponibles" aria-pressed="${filter==='disponibles'}">Sin preparar</button>
    <button class="button-secondary" data-f="descargados" aria-pressed="${filter==='descargados'}">Registrados localmente</button>
  </div>
  <section class="downloads-grid" id="list">
    ${pkgs.filter(p=>filter==='all'||(filter==='descargados')===local.some(l=>l.id===p.id)).map(p=>{
     const isLocal=local.some(l=>l.id===p.id);
     const inProgress=active.some(job=>job.id===p.id&&['preparing','downloading','verifying'].includes(job.status));
    return `<article class="download-card">
      <h3>${esc(p.course)} - ${esc(p.unit)}</h3>
     <p>Grado ${p.grade} · Lecciones: ${p.lessons.length} · Tamaño: ${p.estimatedBytes? (p.estimatedBytes/1048576).toFixed(2)+' MB':'Tamaño no disponible'}</p>
      <p>Estado: <span class="${isLocal?'status-descargado':'status-pending'}">${isLocal?'Registro local disponible':'Sin preparar'}</span></p>
      <button class="button-primary" data-dl="${p.id}" ${isLocal||inProgress?'disabled':''}>${inProgress?'Preparando…':isLocal?'Registrado localmente':'Preparar descarga'}</button>
      <a class="button-secondary" href="${learningURL('myDownloads',route)}">Ver en Mis Descargas</a>
    </article>`;
    }).join('')||'<p class="empty-state" role="status">No hay paquetes en este filtro. Selecciona Todos para consultar el catálogo.</p>'}
  </section>`;
   root.querySelectorAll('[data-f]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.f; render(); root.querySelector(`[data-f="${filter}"]`)?.focus();
   }));
   root.querySelectorAll('[data-dl]').forEach(b=>b.addEventListener('click',async ()=>{
   const id=b.dataset.dl;
   b.disabled=true; b.textContent='Preparando...';
   try {
    await startDownload(id, ()=>{ /* progress tracked via getActive */ active=getActive(); render(); });
     active=getActive();
     const job=active.find(item=>item.id===id);
     if(job?.status==='error')throw new Error(job.error||'No se pudo preparar el paquete.');
     local=await listPackages(); render();
    } catch(e){ shell.openDialog('No se pudo preparar la descarga', `<p>${esc(e.message)}</p>`); render(); }
  }));
 }
 render();
 return ()=>{};
 },{active:'downloads'});
