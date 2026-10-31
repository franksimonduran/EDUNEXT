// Only non-sensitive interface settings. Scope is a demo identity, never authorization.
export const preferenceDefaults=Object.freeze({locale:'es',theme:'system',font:'normal',contrast:'standard',reduceMotion:false,focusHighlight:true,lineHeight:false,tableReadable:false,alias:'',avatar:'av-1',greeting:'professional',avatarTone:'purple',initialRoom:'all',dashboardSection:'overview',showActivities:true,showQuickAccess:true,pageSize:10,tableSort:'alias',density:'normal',calendarView:'month',weekStart:'monday',weekends:true,calendarRoom:'all',eventTypes:['evaluation','task','reinforcement','session','reminder'],editorBlocks:true,editorPreview:true,editorWarnings:true,autosaveDelay:1600,reportHeader:true,reportDate:true,reportMetrics:true,printSize:'normal',audioSpeed:1,reading:true,audio:false,images:true,practice:true,games:true,audioAuto:false});
const enums={locale:['es','en'],theme:['light','dark','system'],font:['normal','large','xlarge'],contrast:['standard','high'],avatar:['av-1','av-2','av-3','av-4','av-5'],greeting:['professional','friendly','brief'],avatarTone:['purple','blue','green'],initialRoom:['all','a4','a5','a6'],calendarRoom:['all','a4','a5','a6'],dashboardSection:['overview','classrooms','content'],pageSize:[10,20,50],tableSort:['alias','grade','room','progress'],density:['normal','compact'],calendarView:['month','week','day'],weekStart:['monday','sunday'],autosaveDelay:[1600,3000,5000],printSize:['normal','large'],audioSpeed:[0.75,1,1.25,1.5]};
export const preferenceScope=()=>/\/admin\//.test(location.pathname)?'demo-admin':/\/monitor\//.test(location.pathname)?'demo-monitor':'demo-student';
export const preferenceKey=(scope=preferenceScope())=>{if(!['demo-admin','demo-monitor','demo-student'].includes(scope))throw new Error('Ámbito de preferencias no válido.');return 'aithron.preferences.v1.'+scope;};
export function validPreference(key,value){
 if(!Object.hasOwn(preferenceDefaults,key))return false;
 if(enums[key])return enums[key].includes(value);
 if(key==='alias')return value===''||typeof value==='string'&&value.trim()===value&&value.length>=2&&value.length<=40&&/^[\p{L}\p{M}\p{N} .’'_-]+$/u.test(value)&&!/[<>]/.test(value)&&!/^\s|\s$|\s{2}/.test(value);
 if(key==='eventTypes')return Array.isArray(value)&&value.length<=5&&new Set(value).size===value.length&&value.every(v=>preferenceDefaults.eventTypes.includes(v));
 return typeof value===typeof preferenceDefaults[key];
}
export function readPreferences(scope=preferenceScope()){
 const defaults=structuredClone(preferenceDefaults);
 try{
  const raw=localStorage.getItem(preferenceKey(scope));
  if(raw){const record=JSON.parse(raw);if(record.version===1&&record.values&&typeof record.values==='object')for(const [key,value] of Object.entries(record.values))if(validPreference(key,value))defaults[key]=value;}
  else if(scope==='demo-student'){
   const legacy={...JSON.parse(localStorage.getItem('aithron.prefs')||'{}'),locale:localStorage.getItem('aithron.locale'),theme:localStorage.getItem('aithron.theme'),alias:localStorage.getItem('aithron.profile.alias'),avatar:localStorage.getItem('aithron.profile.avatar'),...JSON.parse(localStorage.getItem('aithron.a11y')||'{}')};if(legacy.theme==='auto')legacy.theme='system';for(const [k,v] of Object.entries(legacy))if(validPreference(k,v))defaults[k]=v;
  }
 }catch{/* Reading remains usable; writes report storage failures explicitly. */}
 return defaults;
}
export function savePreferences(patch,scope=preferenceScope()){
 if(!patch||typeof patch!=='object'||Object.entries(patch).some(([k,v])=>!validPreference(k,v)))throw new Error('Preferencia no válida. Revisa las selecciones y el alias (2–40 caracteres, sin HTML).');
 const values={...readPreferences(scope),...structuredClone(patch)};
 try{localStorage.setItem(preferenceKey(scope),JSON.stringify({version:1,values,updatedAt:new Date().toISOString()}));}catch{throw new Error('No se pudieron guardar las preferencias en este dispositivo. Revisa el almacenamiento y reintenta.');}
 window.dispatchEvent(new CustomEvent('aithron-preferences-change',{detail:{scope,values}}));return values;
}
export function resetPresentation(scope=preferenceScope()){return savePreferences(Object.fromEntries(['locale','theme','font','contrast','reduceMotion','focusHighlight','lineHeight','tableReadable'].map(k=>[k,preferenceDefaults[k]])),scope);}
window.addEventListener('storage',e=>{if(e.key===preferenceKey())window.dispatchEvent(new CustomEvent('aithron-preferences-change',{detail:{scope:preferenceScope(),values:readPreferences()}}));});
