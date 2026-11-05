import {DEMO_CONTEXT,getDemoEvidence,deriveDemoFeedback,percentLabel} from './metrics.js';

const root=document.querySelector('#d2-content');
const role=document.body.dataset.demoRole;
const links=Object.freeze({
 activity:'../student/recorrido-demo.html?modo=demo',
 student:'../student/index.html?grade=5&modo=demo',
 studentProgress:'../student/progreso.html?grade=5&modo=demo',
 monitor:'../monitor/index.html?modo=demo',
 monitorStudents:'../monitor/estudiantes.html?modo=demo',
 monitorReports:'../monitor/reportes.html?modo=demo',
 admin:'../admin/index.html?modo=demo',
 adminReports:'../admin/reportes.html?modo=demo'
});
const meter=(percent,label)=>`<div class="d2-meter" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>`;
const card=(value,title,description)=>`<section class="d2-card"><span class="d2-number">${value}</span><strong>${title}</strong><span class="d2-caption">${description}</span></section>`;
function status(e){
 return e.completed?`<p class="d2-status">Resultado de la práctica de muestra disponible: ${e.correct} de ${e.total} respuestas correctas.</p>`:
 '<p class="d2-mini">Todavía no hay una práctica terminada en este navegador. Puedes resolverla para generar el resultado.</p>';
}
function studentView(e){
 return `<section class="d2-hero" aria-label="Resumen de aprendizaje"><h2>${DEMO_CONTEXT.student}</h2>
 <p>5.º de primaria · Comunicación · ${DEMO_CONTEXT.lesson}</p>
 ${status(e)}
 <div class="d2-actions"><a href="${links.activity}">${e.completed?'Repetir práctica':'Comenzar práctica'}</a><a class="secondary" href="${links.studentProgress}">Progreso general de muestra</a><a class="secondary" href="${links.student}">Volver al dashboard</a></div></section>
 <div class="d2-grid" aria-label="Indicadores de la práctica">
 ${card(e.completed?'100 %':'0 %','Recorrido guiado completado','Solo esta práctica; no refleja todo el curso')}
 ${card(percentLabel(e.percent),'Respuestas correctas',e.completed?`${e.correct} de ${e.total} preguntas respondidas`:'Aún sin resultado')}
 ${card(e.points,'Puntos de demostración','20 puntos por cada respuesta correcta')}
 <section class="d2-card d2-wide"><h2>Mi progreso en comprensión lectora</h2>
 ${meter(e.completed?100:0,'Progreso del recorrido guiado')}
 <p>${deriveDemoFeedback(e)}</p>
 <h3>Insignia de la actividad</h3><p>${e.achievement?'🏅 '+e.achievement+' — Desbloqueada por obtener al menos 80 %.':'Se desbloquea la insignia «Lector del huerto» con 80 % o más.'}</p>
 <p class="d2-caption">No se suman puntos a las notas académicas ni a los logros históricos de EDUNEXT.</p></section></div>
 <div class="d2-flow" aria-label="Flujo de la presentación"><span>1. Leer</span><span>2. Responder</span><span>3. Aprender</span><span>4. Revisar progreso</span></div>`;
}
function monitorView(e){
 return `<section class="d2-hero"><h2>Seguimiento de ${DEMO_CONTEXT.group}</h2><p>Institución Demo · Área Comunicación. Se muestra únicamente el estudiante del recorrido guiado.</p>
 <div class="d2-actions"><a href="${links.activity}">Abrir práctica</a><a class="secondary" href="${links.monitorStudents}">Ver estudiantes existentes</a><a class="secondary" href="${links.monitorReports}">Reportes docentes</a><a class="secondary" href="${links.monitor}">Panel del monitor</a></div></section>
 <div class="d2-grid">
 ${card('1','Estudiante ficticio','Solo el escenario común de demostración')}
 ${card(e.completed?'1':'0','Prácticas completadas','Evidencias en este navegador')}
 ${card(percentLabel(e.percent),'Aciertos de la práctica','No representa promedio del aula')}
 <section class="d2-card d2-wide"><h2>Ficha de seguimiento · ${DEMO_CONTEXT.student}</h2>
 <label class="d2-filter" for="d2-monitor-filter"><span>Filtrar evidencias</span>
 <select id="d2-monitor-filter"><option value="all">Todas las prácticas de muestra</option><option value="support">Necesitan refuerzo (menos de 80 %)</option></select></label>
 <div id="d2-monitor-rows"></div>
 <p class="d2-mini">El filtro se aplica a la evidencia local de comprensión lectora, no a historiales reales. No se envían datos a otros dispositivos.</p></section></div>`;
}
function renderMonitorRows(e,filter){
 const target=document.querySelector('#d2-monitor-rows');if(!target)return;
 if(!e.completed){target.innerHTML='<p>No hay intentos finalizados. Completa la práctica para ver la evidencia.</p>';return;}
 if(filter==='support'&&e.percent>=80){target.innerHTML='<p>No hay evidencias bajo el umbral de refuerzo de esta demostración.</p>';return;}
 target.innerHTML=`<table aria-label="Resultado del estudiante ficticio"><thead><tr><th>Estudiante</th><th>Actividad</th><th>Resultado</th><th>Orientación</th></tr></thead><tbody>
 <tr><td>${DEMO_CONTEXT.student}</td><td>${DEMO_CONTEXT.lesson}</td><td>${e.correct}/${e.total} (${e.percent} %)</td><td>${e.percent<80?'Se sugiere repasar el texto':'Buen desempeño en esta práctica'}</td></tr></tbody></table>`;
}
function adminView(e){
 const show=e.completed;
 return `<section class="d2-hero"><h2>${DEMO_CONTEXT.institution}</h2>
 <p>Reporte sintético de 5.º A · Comunicación. La plataforma original contiene otros datos de ejemplo que no se mezclan aquí.</p>
 <div class="d2-actions"><a href="${links.admin}">Panel administrativo</a><a class="secondary" href="${links.adminReports}">Reportes existentes</a><a class="secondary" href="${links.activity}">Generar resultado de muestra</a></div></section>
 <div class="d2-grid">
 ${card('1','Participante de ejemplo','Un solo estudiante ficticio en este escenario')}
 ${card(show?'1':'0','Prácticas completadas','Evidencia local de comprensión lectora')}
 ${card(percentLabel(e.percent),'Aciertos observados','No es una media institucional')}
 <section class="d2-card d2-wide"><h2>Consulta de evidencia institucional de muestra</h2>
 <div class="d2-filter"><label for="d2-admin-course">Asignatura</label>
 <select id="d2-admin-course"><option value="all">Todas las áreas</option><option value="com">Comunicación</option><option value="math">Matemática</option></select></div>
 <div id="d2-admin-rows"></div>
 <p class="d2-caption">No se generan matrículas, registros oficiales, promedios institucionales ni comparaciones históricas.</p>
 </section></div>`;
}
function renderAdminRows(e,filter){
 const target=document.querySelector('#d2-admin-rows');if(!target)return;
 if(filter==='math'){target.innerHTML='<p>No hay resultados de Matemática en este escenario guiado.</p>';return;}
 if(!e.completed){target.innerHTML='<p>Sin resultados. Completa primero la práctica de Comunicación.</p>';return;}
 target.innerHTML=`<table aria-label="Evidencia de la demostración"><thead><tr><th>Grado</th><th>Aula</th><th>Curso</th><th>Actividad</th><th>Aciertos</th></tr></thead><tbody>
 <tr><td>5.º</td><td>A</td><td>Comunicación</td><td>${DEMO_CONTEXT.lesson}</td><td>${e.correct}/${e.total} (${e.percent} %)</td></tr></tbody></table>`;
}
function render(){
 if(!root)return;
 const e=getDemoEvidence();
 if(role==='student')root.innerHTML=studentView(e);
 if(role==='monitor'){root.innerHTML=monitorView(e);const select=root.querySelector('#d2-monitor-filter');select?.addEventListener('change',()=>renderMonitorRows(e,select.value));renderMonitorRows(e,'all');}
 if(role==='admin'){root.innerHTML=adminView(e);const select=root.querySelector('#d2-admin-course');select?.addEventListener('change',()=>renderAdminRows(e,select.value));renderAdminRows(e,'all');}
}
if(['student','monitor','admin'].includes(role)){
 render();
 window.addEventListener('storage',event=>{if(event.key?.startsWith('edunext:presentacion:'))render();});
 window.addEventListener('edunext-demo-result',render);
}
