import {field,area,select,esc} from './monitor-content-ui.js';
import {blockTypes} from '../data/lesson-block-types.data.js';
import {dictionaryEntries} from '../data/dictionary-demo.data.js';
export function renderBlockEditor(b,resources){
 if(!b)return '<p>Selecciona un bloque o añade el primero para comenzar.</p>';
 const v=b.content,schema=blockTypes[b.type];
 return `<h2>${esc(schema.label)}</h2><p class="resource-meta">ID: ${esc(b.id)} · Orden ${b.order}</p>`+Object.entries(schema.fields).map(([k,label])=>{
  if(k==='resourceId'||k==='audioId'){
   const type=k==='audioId'?'audio':{image:'image',audio:'audio',practice:'practice',assessment:'practice'}[b.type];
   return select('block-'+k,label,[['','Selecciona un recurso'],...resources.filter(r=>!type||r.type===type).map(r=>[r.id,r.name+(r.type==='practice'?' · 4 ejercicios':'')+' · v'+r.version])],v[k]);
  }
  if(k==='level')return select('block-level',label,[[2,'Sección (h2)'],[3,'Subsección (h3)']],v.level);
  if(k==='entryIds')return `<fieldset><legend>Selecciona términos del diccionario</legend><p>Significado y ejemplos proceden del diccionario local, sin IA generativa.</p>${dictionaryEntries.map(w=>`<label class="check-label"><input type="checkbox" data-word="${esc(w.id)}" ${v.entryIds.includes(w.id)?'checked':''}>${esc(w.word)} → ${esc(w.translation)}</label>`).join('')}</fieldset>`;
  if(k==='items')return `<fieldset><legend>Conceptos de la lección</legend>${v.items.map((item,i)=>`<div class="studio-record" data-concept-row="${i}"><label>Concepto ${i+1}<input data-concept="${i}" value="${esc(item.concept)}" maxlength="160"></label><label>Descripción ${i+1}<textarea data-definition="${i}" maxlength="2000">${esc(item.description)}</textarea></label><div class="actions"><button type="button" data-concept-up="${i}" ${i===0?'disabled':''}>Subir concepto ${i+1}</button><button type="button" data-concept-down="${i}" ${i===v.items.length-1?'disabled':''}>Bajar concepto ${i+1}</button><button type="button" data-concept-delete="${i}">Eliminar concepto ${i+1}</button></div></div>`).join('')}<button id="add-concept" type="button">Añadir concepto</button></fieldset>`;
  return ['title','alt','language'].includes(k)?field('block-'+k,label,v[k],'text','maxlength="500"'):area('block-'+k,label,v[k]);
 }).join('');
}
