import {DEMO_CONTEXT,getDemoEvidence,deriveDemoFeedback,percentLabel} from './metrics.js';

// Small, read-only attachment to EXISTING educational screens.
// Never changes their records, grades, IndexedDB or official state.
const pathname=location.pathname;
const role=pathname.includes('/student/')?'student':pathname.includes('/monitor/')?'monitor':pathname.includes('/admin/')?'admin':null;
const targets={
 student:{selector:'main.learning-main',before:'#learning-content',link:'../student/progreso-demo.html?modo=demo',title:'Mi práctica de lectura',label:'Ver progreso e insignia de esta actividad'},
 monitor:{selector:'main#monitor-main',before:'#page-content',link:'../monitor/seguimiento-demo.html?modo=demo',title:'Resultado de práctica ficticia',label:'Abrir seguimiento de Estudiante Demo 01'},
 admin:{selector:'main#admin-content',before:'.page-header',link:'../admin/informe-demo.html?modo=demo',title:'Evidencia del recorrido guiado',label:'Abrir informe de la demo'}
};
function ensure(){
 if(!role)return null;
 const config=targets[role],main=document.querySelector(config.selector);
 if(!main)return null;
 let el=main.querySelector('.edunext-d2-context');
 if(el)return el;
 el=document.createElement('section');
 el.className='edunext-d2-context';
 el.setAttribute('aria-label','Práctica ficticia compartida entre perfiles');
 const before=main.querySelector(config.before);
 if(before)main.insertBefore(el,before);else main.prepend(el);
 return el;
}
function draw(){
 const el=ensure();if(!el)return;
 const config=targets[role],e=getDemoEvidence();
 const summary=e.completed?
   `${e.correct} de ${e.total} respuestas correctas · ${percentLabel(e.percent)} · ${e.points} puntos demostrativos.`:
   'Sin resultado todavía. Puedes iniciar el recorrido guiado y volver aquí.';
 const feedback=role==='student'?deriveDemoFeedback(e):`La evidencia pertenece a ${DEMO_CONTEXT.student}; no representa notas oficiales ni datos de otros estudiantes.`;
 el.innerHTML=`<h2>${config.title}</h2><p>${summary}</p><p>${feedback}</p><a href="${config.link}">${config.label}</a>`;
}
draw();
window.addEventListener('storage',event=>{if(event.key?.startsWith('edunext:presentacion:'))draw();});
window.addEventListener('edunext-demo-result',draw);
