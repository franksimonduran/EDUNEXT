import {esc,field,select,area} from './monitor-content-ui.js';
import {classroomStates,enrollmentStates,assignmentStates,movementStates,relationshipStates} from '../data/admin-organization-demo.data.js';
export {esc,field,select,area};
const states={classroom:classroomStates,enrollment:enrollmentStates,assignment:assignmentStates,movement:movementStates,section:relationshipStates,period:relationshipStates};
export const stateLabel=(type,state)=>states[type]?.[state]||'Estado local no disponible';
export const orgURL=(page,params={})=>page+'.html?'+new URLSearchParams(Object.entries(params).filter(([,v])=>v!==null&&v!==undefined&&v!==''));
export const orgLink=(page,label,params={})=>`<a class="directory-link" href="${esc(orgURL(page,params))}">${esc(label)}</a>`;
export const orgSummary=items=>`<section class="directory-summary" aria-label="Resumen">${items.map(([label,n])=>`<article><h3>${esc(label)}</h3><strong>${n}</strong></article>`).join('')}</section>`;
export const orgNote=`<p class="directory-note">Las propuestas de esta vista se guardan solo en este dispositivo. No crean aulas, matrículas, asignaciones ni movimientos oficiales: la confirmación institucional corresponde al backend future.</p>`;
export const relationshipBadge=(row)=>row.kind==='base'?'<span class="user-state">Relación de demostración</span>':'<span class="user-state">Propuesta local · sin efectos</span>';
export function validationPanel(result,title='Validación local'){
 const errors=result?.errors||[],warnings=result?.warnings||[];
 return `<section class="monitor-card" role="group" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${errors.length?`<ul class="validation-errors">${errors.map(e=>`<li${e.blocking?' data-blocking="true"':''}>${esc(e.message)}</li>`).join('')}</ul>`:'<p class="content-success">Sin errores de consistencia detectados.</p>'}<ul class="validation-warnings">${warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></section>`;
}
export function proposalActions(record,editPage,{copy=true,dependencies=false}={}){
 const disabled=record.state==='archived'?'disabled':'';
 return `<div class="inline-actions">${editPage?orgLink(editPage,'Editar borrador',{id:record.id}):''}<button type="button" data-org-detail="${esc(record.id)}">Ver detalle</button><button type="button" data-org-validate="${esc(record.id)}">Validar</button>${copy?'<button type="button" data-org-copy="'+esc(record.id)+'">Duplicar borrador</button>':''}${dependencies?'<button type="button" data-org-dependencies="'+esc(record.id)+'">Ver dependencias</button>':''}<button type="button" data-org-archive="${esc(record.id)}" ${disabled}>Archivar</button><button type="button" data-org-delete="${esc(record.id)}">Eliminar borrador</button></div>`;
}
export const dataStateLabel=(row)=>row.kind==='base'?'base-demo':row.state;
