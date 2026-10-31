import {readPreferences,savePreferences} from './preferences.service.js';
import {initTheme,applyTheme} from '../utils/theme-manager.js';
import {initA11y,applyA11y} from '../utils/accessibility-manager.js';
import {setLocale as setAcademicLocale} from '../student/i18n.js';
import {authorizedRooms} from './monitor-students.service.js';
export const monitorPreferences=()=>{const p=readPreferences('demo-monitor'),ids=authorizedRooms().map(r=>r.id);if(!ids.includes(p.initialRoom))p.initialRoom='all';if(!ids.includes(p.calendarRoom))p.calendarRoom='all';return p;};
export function saveMonitorPreferences(patch){for(const key of ['initialRoom','calendarRoom'])if(patch[key]&&patch[key]!=='all'&&!authorizedRooms().some(r=>r.id===patch[key]))throw new Error('El aula no pertenece al Monitor.');return savePreferences(patch,'demo-monitor');}
let initialized=false;
export function initializeMonitorSettings(){
 const apply=()=>{const p=monitorPreferences(),r=document.documentElement;r.lang=p.locale;setAcademicLocale(p.locale);applyTheme(p.theme,{persist:false,scope:'demo-monitor'});applyA11y(p,{persist:false,scope:'demo-monitor'});for(const key of ['density','reportHeader','reportDate','reportMetrics','printSize','editorWarnings'])r.dataset[key]=String(p[key]);document.querySelectorAll('audio').forEach(audio=>audio.playbackRate=p.audioSpeed);};
 if(!initialized){initTheme('demo-monitor');initA11y('demo-monitor');window.addEventListener('aithron-preferences-change',e=>{if(e.detail.scope==='demo-monitor')apply();});new MutationObserver(changes=>{if(changes.some(c=>c.addedNodes.length)){const speed=monitorPreferences().audioSpeed;document.querySelectorAll('audio').forEach(a=>{if(a.playbackRate!==speed)a.playbackRate=speed;});}}).observe(document.body,{childList:true,subtree:true});initialized=true;}
 apply();
}
