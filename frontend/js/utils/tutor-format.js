import {escapeHTML as esc} from '../components/student-ui.js';
import {renderLearningVisual} from '../components/learning-visual.js';
import {learningURL} from '../student/learning-routes.js';
import {tt} from '../student/tutor-i18n.js';
export function tutorText(value){return esc(value??'').replace(/\n/g,'<br>');}
export function formatTutorBlock(block){
 if(block.kind==='paragraph')return `<p lang="es">${tutorText(block.text)}</p>`;
 if(block.kind==='steps')return `<ol class="tutor-steps" lang="es">${block.items.map(item=>`<li>${tutorText(item)}</li>`).join('')}</ol>`;
 if(['example','hint','question'].includes(block.kind))return `<div class="tutor-explanation tutor-${block.kind}"><h3>${tt({example:'example',hint:'tip',question:'question'}[block.kind])}</h3><p lang="es">${tutorText(block.text)}</p></div>`;
 if(block.kind==='visual')return renderLearningVisual(block.image);
 if(block.kind==='math'){
  if(![block.numerator,block.denominator,block.decimal,block.percent].every(Number.isFinite)||block.denominator<=0)return '';
  return `<div class="tutor-math"><h3>${tt('math')}</h3><div class="tutor-operation" lang="es"><span class="tutor-fraction" role="img" aria-label="${block.numerator} sobre ${block.denominator}"><span aria-hidden="true">${block.numerator}</span><span aria-hidden="true">${block.denominator}</span></span>${block.grade>=5?`<span>=</span><strong>${block.decimal}</strong>`:''}${block.grade>=6?`<span>=</span><strong>${block.percent} %</strong>`:''}</div></div>`;
 }
 if(block.kind==='review')return `<a class="tutor-review-link" href="${learningURL('lesson',{grade:block.example.grade,course:block.example.courseId,unit:block.example.unitId,lesson:block.example.lessonId})}">${tt('reviewLink')}: <span lang="es">${esc(block.example.title)}</span> →</a>`;
 return `<p class="tutor-notice">${tt(block.kind==='unavailable'?'unknown':block.kind==='noVisual'?'noVisual':'error')}</p>`;
}
