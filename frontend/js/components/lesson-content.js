import {escapeHTML as esc} from './student-ui.js';
import {renderLearningVisual} from './learning-visual.js';
import {dictionaryEntries} from '../data/dictionary-demo.data.js';
import {safeResourceURL} from '../utils/content-safety.js';
// One safe structured renderer shared with Aprende. No progress or result writes.
const paragraphs=s=>String(s||'').split(/\n\s*\n/).filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
const list=s=>`<ul>${String(s||'').split('\n').filter(t=>t.trim()).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
export function renderLessonBlocks(blocks,resources=[]){
 const resource=id=>resources.find(r=>r.id===id);
 const link=id=>{const r=resource(id),url=r&&safeResourceURL(r.url);return url?`<a class="button-secondary" href="${esc(url)}" target="_blank" rel="noopener">${esc(r.name)} ↗</a>`:'<p class="content-error">Recurso no disponible</p>';};
 return blocks.map(b=>{const v=b.content||b;switch(b.type){
  case 'heading':return `<h${v.level===3?3:2}>${esc(v.text||'')}</h${v.level===3?3:2}>`;
  case 'paragraph':return paragraphs(v.text);
  case 'callout':return `<aside class="concept-callout"><h2>${esc(v.title||'Recuerda')}</h2>${paragraphs(v.text)}</aside>`;
  case 'example':return `<section class="content-example"><h2>${esc(v.title||'Ejemplo resuelto')}</h2>${paragraphs(v.problem)}${paragraphs(v.explanation)}<ol>${String(v.steps||'').split('\n').filter(Boolean).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p><strong>Resultado:</strong> ${esc(v.result||'')}</p>${paragraphs(v.observation)}</section>`;
  case 'image':{const r=resource(v.resourceId),url=r&&safeResourceURL(r.url);return url?`<figure><img src="${esc(url)}" alt="${esc(v.alt||'')}" loading="lazy"><figcaption>${esc(v.caption||'')}</figcaption></figure>`:'<p>Imagen no disponible</p>';}
  case 'audio':{const r=resource(v.resourceId),url=r&&safeResourceURL(r.url);return `<section><h2>${esc(r?.name||'Audio educativo')}</h2>${url?`<audio controls preload="metadata" src="${esc(url)}" aria-label="${esc(r.name)}"></audio>`:'<p>Audio no disponible</p>'}<p>Idioma: ${esc(v.language||r?.language||'No registrado')} · Duración: consultar al cargar el audio</p><details open><summary>Alternativa textual</summary>${paragraphs(v.transcript)}</details></section>`;}
  case 'vocabulary':return `<section><h2>Vocabulario</h2><dl>${(v.entryIds||[]).map(id=>{const w=dictionaryEntries.find(w=>w.id===id);return w?`<dt>${esc(w.word)} → ${esc(w.translation)}</dt><dd>${esc(w.example)} / ${esc(w.exampleTranslation)}</dd>`:'';}).join('')}</dl>${paragraphs(v.pronunciation)}${v.audioId?link(v.audioId):''}</section>`;
  case 'concepts':return `<dl>${(v.items||[]).map(i=>`<dt>${esc(i.concept)}</dt><dd>${esc(i.description)}</dd>`).join('')}</dl>`;
  case 'reflection':return `<section class="concept-callout"><h2>${esc(v.question||'Reflexiona')}</h2>${paragraphs(v.guidance)}<p>Propósito: ${esc(v.objective||'')}</p><p>Reflexión sin puntaje ni registro de respuestas.</p></section>`;
  case 'practice':case 'assessment':return `<section class="content-example"><h2>${b.type==='assessment'?'Autoevaluación formativa':'Actividad práctica'}</h2>${paragraphs(v.purpose)}${link(v.resourceId)}<p>Abre la actividad existente en otra pestaña. La vista previa no inicia intentos ni registra progreso.</p></section>`;
  case 'resource':return `<section>${paragraphs(v.description)}${link(v.resourceId)}</section>`;
  case 'summary':return `<section class="concept-callout"><h2>Para recordar</h2>${list(v.ideas)}<h3>Conceptos clave</h3>${list(v.concepts)}${paragraphs(v.recommendations)}${v.resourceId?link(v.resourceId):''}</section>`;
  default:return '<p>Bloque no compatible</p>';
 }}).join('');
}
export function renderBaseLessonReading(lesson,{remember='Recuerda',example='Ejemplo'}={}){return `${renderLessonBlocks(lesson.blocks.map(b=>b.type==='callout'?{...b,title:remember}:b))}<h2>${esc(example)}</h2><p>${esc(lesson.examples[0])}</p>${renderLearningVisual(lesson.images[0])}`;}
