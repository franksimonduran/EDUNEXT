import {text} from '../student/i18n.js';
import {pt,activityItemsLabel} from '../student/practice-i18n.js';
import {learningURL} from '../student/learning-routes.js';
import {icon} from './icons.js';
import {escapeHTML as esc} from './student-ui.js';
export function renderPracticeCard(activity,{completed=false,run,originLesson}={}){
 const url=learningURL(activity.kind==='game'?'game':'exercise',{grade:activity.grade,activity:activity.id,run,lesson:originLesson});
 const count=activity.type==='memory'?activity.pairs.length:activity.questions.length;
 return `<article class="practice-card tone-${activity.tone}">
  <div class="practice-card-art">${icon(activity.kind==='game'?'games':activity.icon)}<span>${pt(activity.difficulty)}</span></div>
  <div class="practice-card-content">
   <p class="activity-course">${esc(text(activity.courseName))} · ${activity.grade}.º</p>
   <h2 lang="es">${esc(activity.name)}</h2><p lang="es">${esc(activity.description)}</p>
   <p class="activity-topic" lang="es">${esc(activity.topic)}</p>
   <p class="activity-facts">${count} ${activityItemsLabel(count,activity.type==='memory')} · ${activity.estimatedMinutes} ${pt('minutes')}</p>
   <span class="status-pill">${pt(completed?'done':run?'progress':'available')}</span>
   <a class="button-secondary" href="${esc(url)}">${pt(run?'resume':activity.kind==='game'?'play':'start')}${icon('arrow')}</a>
  </div>
 </article>`;
}
