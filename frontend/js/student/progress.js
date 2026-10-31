import { bootLearningPage } from './learning-page.js';
import { getProgress } from '../data/progress-demo.data.js';
import { renderProgressBar } from '../components/progress-summary.js';
import { renderCourseProgressCard } from '../components/course-progress-card.js';
import { renderLearningRecommendation } from '../components/learning-recommendation.js';
import { getStrengths, getWeaknesses, calculateProgressPercent } from '../utils/progress-calculator.js';
import { icon } from '../components/icons.js';
import {escapeHTML as esc} from '../components/student-ui.js';
import {getOwnProgress,getOwnAchievements,completeOwnLesson,useProgressApi} from '../services/progress-api.service.js';
import {renderReportsApi} from '../components/reports-api-view.js';

const live=useProgressApi();
bootLearningPage(async route => {
 if(!live)return {route,grade:route.grade};
 if(['reportes','insights'].includes(new URLSearchParams(location.search).get('vista')))return {route,reports:true};
 try{return {route,progress:await getOwnProgress(),achievements:await getOwnAchievements()};}
 catch(error){return {route,error};}
}, (model, _route, shell) => {
  const {route}=model;
 if(model.reports)return renderReportsApi(document.querySelector('#learning-content'),'me');
 if(model.error){document.querySelector('#learning-content').innerHTML=`<section class="dashboard-card" role="alert"><h1>Progreso no disponible</h1><p>${esc(model.error.message)}</p><p>No se muestran cifras de demostración en modo API. Recarga para reintentar.</p></section>`;return ()=>{};}
 if(live)return renderServerProgress(model);
 document.title = 'Mi progreso | EDUNEXT';
 const root = document.querySelector('#learning-content');
 const grade = route.grade ? Number(route.grade) : 4;
 const p = getProgress({ grade });
 const generalPercent = calculateProgressPercent(p.general.completedLessons, p.general.totalLessons);
 const strengths = getStrengths(p.courses);
 const weaknesses = getWeaknesses(p.courses);

 root.innerHTML = `<header class="prog-header">
  <div class="prog-title-row">
   <span class="prog-avatar" aria-hidden="true">${icon('chart')}</span>
   <div class="prog-heading">
    <span class="kicker">EDUNEXT PROGRESO</span>
    <h1>Mi progreso académico</h1>
    <p>Descubre cuánto has avanzado y qué puedes seguir aprendiendo</p>
   </div>
  </div>
 </header>
 <section class="prog-summary">
  <article class="prog-sum-card"><div><strong>${p.courses.length}</strong><div>Cursos en progreso</div></div></article>
  <article class="prog-sum-card"><div><strong>${p.general.completedLessons}</strong><div>Lecciones completadas</div></div></article>
  <article class="prog-sum-card"><div><strong>${p.general.completedPractices}</strong><div>Prácticas realizadas</div></div></article>
  <article class="prog-sum-card"><div><strong>${p.general.achievements}</strong><div>Logros obtenidos</div></div></article>
 </section>
 <section class="prog-general">
  <h2>Progreso general</h2>
  ${renderProgressBar(generalPercent)}
  <p>${p.general.completedLessons}/${p.general.totalLessons} lecciones · <span style="color:var(--color-muted)">Datos de demostración</span></p>
  <a class="button-primary" href="aprende.html?grade=${grade}">Ir a Mis cursos</a>
 </section>
 <section>
  <h2>Progreso por asignatura</h2>
  <div class="courses-grid">${p.courses.map(renderCourseProgressCard).join('')}</div>
 </section>
 <section>
  <h2>Fortalezas y áreas por reforzar</h2>
  <div class="rec-list">
   ${strengths.map(s=>renderLearningRecommendation({text:s.text})).join('')}
   ${weaknesses.map(w=>renderLearningRecommendation({text:w.text,link:w.link})).join('')}
  </div>
 </section>`;
 return ()=>{};
},{active:'progress',demoMessage:()=> live?'Finalizaciones registradas en servidor; no equivalen a notas ni dominio.':'Datos de demostración'});

function renderServerProgress(model){
 model.serverProgressController?.abort();
 const root=document.querySelector('#learning-content');
 document.title='Mi progreso | EDUNEXT';
 const p=model.progress;
 const percent=value=>value===null?'<p>Sin contenido aplicable</p>':renderProgressBar(value);
 root.innerHTML=`<header class="prog-header"><h1>Mi progreso</h1><p>Fuente: registros del servidor. El porcentaje mide lecciones revisadas, no una calificación.</p><a class="button-secondary" href="progreso.html?modo=api&vista=reportes">Consultar reportes personales</a></header>
 <section class="prog-summary"><article class="prog-sum-card">${p.active_courses_count} cursos autorizados</article><article class="prog-sum-card">${p.completed_lessons_count} / ${p.applicable_lessons_count} lecciones revisadas</article><article class="prog-sum-card">${p.earned_achievements_count} reconocimientos personales</article></section>
 <section class="prog-general"><h2>Finalización de lecciones</h2>${percent(p.completion_percentage)}</section>
 <p role="status" id="server-progress-status"></p>
 <section><h2>Por curso</h2><div class="courses-grid">${p.courses.map(course=>`<article class="dashboard-card"><h3>${esc(course.title)}</h3>${percent(course.completion_percentage)}<p>${course.completed_lessons_count}/${course.applicable_lessons_count} lecciones revisadas</p><ul>${course.lessons.map(lesson=>`<li>${esc(lesson.title)} · ${lesson.status==='completed'?'Revisada (declaración del estudiante)':lesson.status==='started'?'Iniciada':'No iniciada'} ${lesson.status==='completed'?'':`<button type="button" data-complete-lesson="${esc(lesson.lesson_id)}" data-version="${esc(lesson.lesson_version_id)}">Marcar como revisada</button>`}</li>`).join('')}</ul></article>`).join('')||'<p>Sin cursos autorizados disponibles.</p>'}</div></section>
 <section><h2>Reconocimientos personales</h2>${model.achievements.filter(a=>a.status==='earned').map(a=>`<article class="dashboard-card"><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p></article>`).join('')||'<p>Sin reconocimientos obtenidos.</p>'}</section>
 <section><h2>Otras fuentes</h2><p>Prácticas, juegos, evaluaciones y competencias: integración confirmada no disponible. No se sustituyen por valores de demostración.</p></section>`;
 if(!p.can_record_own_activity)root.querySelectorAll('[data-complete-lesson]').forEach(button=>button.remove());
 const controller=new AbortController();
 model.serverProgressController=controller;
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-complete-lesson]');
  if(!button)return;
  button.disabled=true;
  const status=root.querySelector('#server-progress-status');
  status.textContent='Guardando declaración de revisión…';
  let saved=false;
  try{
   await completeOwnLesson(button.dataset.completeLesson,button.dataset.version);
   saved=true;
   const [progress,achievements]=await Promise.all([getOwnProgress(),getOwnAchievements()]);
   model.progress=progress;model.achievements=achievements;
   renderServerProgress(model);
   root.querySelector('#server-progress-status').textContent='Revisión registrada en servidor.';
  }catch(error){status.textContent=saved?'La revisión se guardó, pero no pudo actualizarse la vista. Recarga para consultar el estado.':`No se confirmó el guardado: ${error.message}`;button.disabled=false;}
 },{signal:controller.signal});
 return ()=>model.serverProgressController?.abort();
}
