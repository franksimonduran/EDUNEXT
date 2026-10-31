import {adminShell} from './admin-shell.js';
import {esc} from '../components/admin-relationship-validation.js';
export const organizationShell=(title,active)=>adminShell(title,active,{locale:'es'});
export const queryParams=()=>new URLSearchParams(location.search);
export const syncQueryParams=(values,keys=[])=>{const params=new URLSearchParams(location.search);for(const key of keys){const value=values?.[key];if(value===''||value===null||value===undefined||value==='all')params.delete(key);else params.set(key,String(value));}const query=params.toString();history.replaceState(null,'',location.pathname+(query?'?'+query:''));};
export const queryValue=(key,fallback='')=>{const value=queryParams().get(key);return value===null?fallback:value;};
export const hasRepeatedParams=()=>{const params=queryParams();return [...params.keys()].some(k=>params.getAll(k).length>1);};
export function createGuard(){let dirty=false;return {set:()=>dirty=true,clear:()=>dirty=false,dirty:()=>dirty,leave:()=>{if(dirty&&!confirm('Hay cambios sin guardar. ¿Deseas descartarlos?'))return false;dirty=false;return true;}};}
export const installUnsavedGuard=(guard)=>{window.addEventListener('beforeunload',e=>{if(guard.dirty()){e.preventDefault();e.returnValue='';}});window.addEventListener('click',e=>{if(guard.dirty()&&e.target.closest('a[href],[data-section],[data-admin-module]')&&!guard.leave()){e.preventDefault();e.stopImmediatePropagation();}},true);};
export const formatDate=value=>value?new Intl.DateTimeFormat(document.documentElement.lang||'es',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Sin fecha disponible';
export const optionList=(items,valueKey='id',labelKey='label')=>items.map(item=>[item[valueKey],item[labelKey]]);
export function installProposalActions({root,open,refresh,load,handlers}){
 document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-org-detail],[data-org-validate],[data-org-copy],[data-org-archive],[data-org-delete],[data-org-dependencies]');
  if(!button)return;
  const key=['detail','validate','copy','archive','delete','dependencies'].find(k=>button.dataset['org'+k[0].toUpperCase()+k.slice(1)]);
  if(!key||!handlers[key])return;
  const id=button.dataset['org'+key[0].toUpperCase()+key.slice(1)];
  try{const record=await load(id);if(!record){open('Registro no disponible',`<p>${esc('El borrador no existe, fue archivado o cambió de estado. Recarga la vista.')}</p>`);await refresh();return;}await handlers[key](record,{root,open,refresh});}
  catch(error){open('No se completó la operación',`<p>${esc(error.message)}</p>`);}
 });
}
export const statusMessage=(root,text)=>{const target=root.querySelector('#org-message');if(target)target.textContent=text;};
export const withBusy=async(button,task)=>{const previous=button?.textContent;if(button){button.disabled=true;button.textContent='Procesando…';}try{return await task();}finally{if(button){button.disabled=false;button.textContent=previous;}}};
export const emptyState=(text='Sin registros coincidentes. Revisa o limpia los filtros.')=>`<p class="admin-empty" role="status">${esc(text)}</p>`;
