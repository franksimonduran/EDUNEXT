import {DEMO_STUDENT,DEMO_READING,readDemoResult} from './scenario.js';

// Visible ONLY on the three existing demo dashboards. Never changes official metrics.
const path=location.pathname;
const role=path.endsWith('/student/index.html')?'student':path.endsWith('/monitor/index.html')?'monitor':path.endsWith('/admin/index.html')?'admin':null;
const host=role?document.querySelector(role==='admin'?'#admin-content':'#dashboard-content'):null;
const titles={student:'Tu recorrido de aprendizaje',monitor:'Seguimiento del estudiante de muestra',admin:'Vista institucional de la demostración'};
const roleDestinations={student:'../student/progreso-demo.html?modo=demo',monitor:'../monitor/seguimiento-demo.html?modo=demo',admin:'../admin/informe-demo.html?modo=demo'};
const roleLabels={student:'Mi progreso de la práctica',monitor:'Seguimiento guiado',admin:'Informe institucional de muestra'};
const subtitles={
 student:'Realiza la lectura de Comunicación y revisa tu resultado.',
 monitor:'Consulta el mismo resultado de práctica de Estudiante Demo 01 en este navegador.',
 admin:'Observa el resultado de ejemplo compartido entre los tres perfiles, sin modificar estadísticas institucionales oficiales.'
};
function refresh(){
 if(!host||!role)return;
 let panel=host.querySelector(':scope > .edunext-demo-journey');
 if(!panel){panel=document.createElement('section');panel.className='edunext-demo-journey';panel.setAttribute('aria-label','Recorrido interactivo de demostración');host.prepend(panel);}
 const result=readDemoResult();
 const hasResult=Boolean(result);
 const score=hasResult?`<div class="edunext-demo-journey__score" role="status"><strong>${result.percent}%</strong><span>${result.correct} de ${result.total} respuestas correctas<br><small>Resultado ficticio · ${DEMO_STUDENT.group}</small></span></div>`:
 `<div class="edunext-demo-journey__pending" role="status"><strong>Aún sin resultado</strong><span>Resuelve las cinco preguntas para crear una evidencia local de demostración.</span></div>`;
 const action=role==='student'?'Comenzar práctica':'Abrir práctica de ejemplo';
 panel.innerHTML=`<div class="edunext-demo-journey__copy"><span class="edunext-demo-journey__eyebrow">RECORRIDO PRESENTACIÓN · DATOS FICTICIOS</span>
  <h2>${titles[role]}</h2><p>${subtitles[role]}</p>
  <p class="edunext-demo-journey__context">${DEMO_READING.course} · ${DEMO_READING.topic} · ${DEMO_STUDENT.group}</p>
  <div class="edunext-demo-journey__links"><a href="../student/recorrido-demo.html?modo=demo">${action}</a><a href="${roleDestinations[role]}">${roleLabels[role]}</a><a href="../demo.html">Cambiar de perfil</a></div></div>
  ${score}`;
}
if(host){
 // Monitor and admin re-render innerHTML; restore the independent demo summary.
 const observer=new MutationObserver(records=>{if(records.some(record=>record.target===host&&!host.querySelector(':scope > .edunext-demo-journey')))refresh();});
 observer.observe(host,{childList:true});
 refresh();
 window.addEventListener('storage',event=>{if(event.key?.startsWith('edunext:presentacion:'))refresh();});
 window.addEventListener('edunext-demo-result',refresh);
}
