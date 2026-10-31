import { bootLearningPage } from './learning-page.js';
import { applyA11y, loadA11y } from '../utils/accessibility-manager.js';
import { t } from '../i18n/i18n.js';

bootLearningPage(route => ({ route, grade: route.grade }), ({ route }, _route, shell) => {
 document.title = `${t('accessibility')} | EDUNEXT`;
 const root = document.querySelector('#learning-content');
 let a = loadA11y();
 applyA11y(a,{persist:false});

 function render(){
  root.innerHTML = `<header><h1>${t('accessibility')}</h1><p>Adapta la plataforma para aprender con comodidad</p></header>
  <section class="prof-card">
   <label>Tamaño de texto <select id="font"><option value="normal" ${a.font==='normal'?'selected':''}>Normal</option><option value="large" ${a.font==='large'?'selected':''}>Grande</option><option value="xlarge" ${a.font==='xlarge'?'selected':''}>Muy grande</option></select></label>
   <label>Contraste <select id="contrast"><option value="standard" ${a.contrast==='standard'?'selected':''}>Estándar</option><option value="high" ${a.contrast==='high'?'selected':''}>Alto contraste</option></select></label>
   <label><input type="checkbox" id="motion" ${a.reduceMotion?'checked':''}> Reducir animaciones</label>
   <div class="a11y-preview"><h3>Vista previa</h3><p>Este es un ejemplo de texto para ver los cambios.</p><button class="button-primary">Botón de ejemplo</button></div>
   <div style="display:flex;gap:.5rem"><button class="button-primary" id="apply">Aplicar</button><a class="button-secondary" href="configuracion.html">Volver</a></div>
  </section>`;
  root.querySelector('#font').addEventListener('change',e=>{ a.font=e.target.value; });
  root.querySelector('#contrast').addEventListener('change',e=>{ a.contrast=e.target.value; });
  root.querySelector('#motion').addEventListener('change',e=>{ a.reduceMotion=e.target.checked; });
  root.querySelector('#apply').addEventListener('click',()=>{try{applyA11y(a);shell.openDialog('Guardado',`<p>${t('savedLocal')}</p>`);}catch{shell.openDialog('Error de almacenamiento','<p>No se pudieron guardar los ajustes de accesibilidad.</p>');}});
 }
 render();
 return ()=>{};
},{active:'profile'});
