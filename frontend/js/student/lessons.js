import { bootLearningPage } from './learning-page.js';
import { getLesson } from '../services/lesson.service.js';
import { lt } from './learning-i18n.js';
import { text } from './i18n.js';
import { learningURL } from './learning-routes.js';
import { breadcrumb } from './learning-shell.js';
import { renderLessonIndex, renderLessonNavigation, lessonHref } from '../components/lesson-navigation.js';
import { renderAudioPlayer, setupAudioPlayer } from '../components/audio-player.js';
import { renderLearningTabs, setupLearningTabs } from '../components/learning-tabs.js';
import { renderLearningVisual } from '../components/learning-visual.js';
import {renderBaseLessonReading} from '../components/lesson-content.js';
import { escapeHTML as esc, progressBar } from '../components/student-ui.js';
import {renderTutorLearningActions} from '../components/tutor-learning-actions.js';
import {tt as ttu} from './tutor-i18n.js';
import {ts as tst} from './translator-i18n.js';

bootLearningPage(route=>getLesson(route.grade,route.course,route.unit,route.lesson),({course,unit,lesson},route,shell)=>{
 document.title=`${lesson.title} | EDUNEXT`;
 const root=document.querySelector('#learning-content');
 root.innerHTML=`${breadcrumb([{label:lt('catalog'),href:learningURL('catalog',route)},{label:text(course.name),href:learningURL('course',route)},{label:unit.title,href:learningURL('unit',route)},{label:lt('lessonNumber',{count:lesson.number})}])}<header class="lesson-header"><div><span class="eyebrow-light">${esc(text(course.name))} · ${esc(unit.title)}</span><h1 lang="es">${esc(lesson.title)}</h1><p>${lt('lessonNumber',{count:lesson.number})} / ${unit.lessons.length} · ${lt('minutes',{count:lesson.duration})}</p></div><a class="button-secondary" href="${learningURL('unit',route)}">← ${lt('backUnit')}</a></header><div class="lesson-progress"><span>${lt('progress')}: ${lesson.progress}% · ${lt('demo')}</span>${progressBar(lesson.progress,lesson.title)}</div><div class="lesson-layout"><div class="lesson-workspace"><div class="lesson-study dashboard-card">${renderLearningTabs()}<section class="learning-panel" id="panel-read" role="tabpanel" aria-labelledby="tab-read" tabindex="0"><p class="lesson-objective" lang="es">${esc(lesson.objective)}</p><div class="lesson-reading" lang="es">${lesson.blocks.map(block=>block.type==='callout'?`<aside class="concept-callout"><h2>${lt('remember')}</h2><p>${esc(block.text)}</p></aside>`:`<p>${esc(block.text)}</p>`).join('')}<h2>${lt('example')}</h2><p>${esc(lesson.examples[0])}</p>${renderLearningVisual(lesson.images[0])}</div></section><section class="learning-panel" id="panel-listen" role="tabpanel" aria-labelledby="tab-listen" tabindex="0" hidden><h2>${lt('listen')}</h2>${renderAudioPlayer(lesson.audio)}</section><section class="learning-panel" id="panel-view" role="tabpanel" aria-labelledby="tab-view" tabindex="0" hidden><h2>${lt('view')}</h2>${lesson.images.map(renderLearningVisual).join('')}</section><section class="learning-panel" id="panel-practice" role="tabpanel" aria-labelledby="tab-practice" tabindex="0" hidden><h2>${lt('practice')}</h2><p class="muted">${lt('practiceDemo')}</p><form id="lesson-exercise" novalidate><fieldset><legend lang="es">${esc(lesson.exercise.question)}</legend>${lesson.exercise.options.map((option,index)=>`<label class="exercise-option"><input type="radio" name="answer" value="${index}" aria-describedby="exercise-feedback"><span lang="es">${esc(option)}</span></label>`).join('')}</fieldset><button class="button-primary exercise-check" type="submit">${lt('check')}</button></form><p class="exercise-feedback" id="exercise-feedback" role="status" aria-live="polite"></p><button class="button-secondary" type="button" id="exercise-continue" hidden>${lt('continueExercise')}</button></section><div class="lesson-help-bar"><span>${lt('offlineUnavailable')}</span><button class="button-secondary" type="button" id="help-button">${lt('noUnderstand')}</button></div></div>${renderLessonNavigation(unit,lesson)}</div><aside class="lesson-index-column">${renderLessonIndex(unit,lesson.id)}</aside></div>`;
  const reading=root.querySelector('.lesson-reading');
  reading.innerHTML=renderBaseLessonReading(lesson,{remember:lt('remember'),example:lt('example')});
 const fullPractice=document.createElement('a');
 fullPractice.className='button-secondary full-practice-link';
 fullPractice.href=learningURL('exercise',{grade:route.grade,activity:`practice-${course.id}-${route.grade}`,lesson:lesson.id});
 fullPractice.textContent='EDUNEXT PRACTICA · '+(document.documentElement.lang==='en'?'Open full practice':'Abrir práctica completa');
 root.querySelector('#panel-practice').insertBefore(fullPractice,root.querySelector('#lesson-exercise'));
 reading.removeAttribute('lang');
 reading.querySelectorAll('p').forEach(paragraph=>{paragraph.lang='es';});
 const pauseAudio=setupAudioPlayer(root);
 setupLearningTabs(root,mode=>{if(mode!=='listen')pauseAudio();});
 // En móvil el índice empieza plegado; en escritorio permanece visible.
 const index=root.querySelector('.lesson-index');
 index.open=matchMedia('(min-width: 901px)').matches;
 const resize=event=>{index.open=event.matches;};
 const media=matchMedia('(min-width: 901px)');media.addEventListener('change',resize);
 const form=root.querySelector('#lesson-exercise');
 const feedback=root.querySelector('#exercise-feedback');
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const answer=form.querySelector('[name="answer"]:checked');
  if(!answer){feedback.textContent=lt('selectAnswer');form.querySelector('input').focus();return;}
  const correct=Number(answer.value)===lesson.exercise.answer;
  feedback.dataset.correct=String(correct);
  feedback.textContent=`${lt(correct?'correct':'tryAgain')}. ${correct?lesson.exercise.correct:lesson.exercise.incorrect}`;
  root.querySelector('#exercise-continue').hidden=false;
 });
 form.addEventListener('change',()=>{feedback.textContent='';root.querySelector('#exercise-continue').hidden=true;});
 root.querySelector('#exercise-continue').addEventListener('click',()=>{
  const next=unit.lessons[lesson.number];
  location.assign(next?lessonHref(next):learningURL('unit',route));
 });
  root.querySelector('#help-button').addEventListener('click',()=>{
    pauseAudio();
    shell.openDialog(lt('noUnderstand'),`<p class="dialog-helper">${lt('demo')}</p>${renderTutorLearningActions({attribute:'data-help',includeTutor:true})}<div id="help-content" class="help-content" role="status"></div>`);
    const dialogRoot=document.querySelector('#dashboard-dialog-content');
    dialogRoot.querySelectorAll('[data-help]').forEach(button=>button.addEventListener('click',()=>{
     const kind=button.dataset.help;
     const content=dialogRoot.querySelector('#help-content');
     if(kind==='tutor'){
      content.innerHTML=`<p>${ttu('notGenerated')}</p><a class="button-secondary" id="lesson-tutor-link" href="${learningURL('tutor',{grade:route.grade,course:course.id,unit:unit.id,lesson:lesson.id})}">${ttu('openTutor')}</a>`;return;
     }
     if(kind==='translate'){
      content.innerHTML=`<p>${tst('description')}</p><a class="button-secondary" href="${learningURL('translator',{grade:route.grade,course:course.id,unit:unit.id,lesson:lesson.id})}">${tst('title')}</a>`;return;
     }
     if(kind==='practice'){location.assign(learningURL('exercise',{grade:route.grade,activity:`practice-${course.id}-${route.grade}`,lesson:lesson.id}));return;}
     if(kind==='hint'){content.textContent=`${lesson.objective} ¿Qué parte del ejemplo te puede ayudar a explicarlo?`;return;}
     content.innerHTML=kind==='drawing'?renderLearningVisual(lesson.images[0]):kind==='steps'?`<ol lang="es">${lesson.help.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`:`<p ${kind==='tutor'?'':'lang="es"'}>${esc(kind==='tutor'?lt('tutorNote'):kind==='easy'?lesson.help.easy:lesson.help.example)}</p>`;
    }));
  });
 return ()=>{pauseAudio();media.removeEventListener('change',resize);};
});
