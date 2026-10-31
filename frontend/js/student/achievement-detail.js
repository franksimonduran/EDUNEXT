import { bootLearningPage } from './learning-page.js';
import { getAchievement } from '../data/achievements-demo.data.js';
import { icon } from '../components/icons.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = 'Detalle logro | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const params = new URLSearchParams(location.search);
 const id = params.get('id');
 const a = getAchievement(id);

 if(!a){
  root.innerHTML = '<section><h1>Logro no encontrado</h1></section>';
  return ()=>{};
 }

 root.innerHTML = `<header class="prog-header"><div class="prog-title-row"><span class="prog-avatar" aria-hidden="true">${icon(a.icon||'award')}</span><div class="prog-heading"><h1>${a.name}</h1><p>${a.desc}</p></div></div><div class="prog-header-actions"><a class="button-secondary" href="logros.html">Volver a Logros</a></div></header>
 <section class="prog-general">
  <h2>Detalle</h2>
  <p><strong>Objetivo:</strong> ${a.desc}</p>
  <p><strong>Progreso:</strong> ${a.progress}/${a.goal}</p>
  <p><strong>Estado:</strong> ${a.status}</p>
  ${a.date?`<p><strong>Fecha de obtención:</strong> ${new Date(a.date).toLocaleDateString()}</p>`:''}
  <div class="prog-player-nav"><a class="button-primary" href="practica.html?grade=4">Continuar practicando</a></div>
 </section>`;
 return ()=>{};
},{active:'achievements'});
